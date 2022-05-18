// see https://astexplorer.net/ for more help.

import j from 'jscodeshift';
import { namedTypes } from 'ast-types';
// for parsing js config file
export class JSConfigASTHelper {
  private astRoot: j.Collection<namedTypes.ObjectExpression> | null;
  constructor(sourceCode: string) {
    this.astRoot = this.getExportDefaultRoot(sourceCode) || this.getModuleExportsRoot(sourceCode);
  }

  // get export default root node
  private getExportDefaultRoot(sourceCode: string) {
    const root = j(sourceCode).find(j.ExportDefaultDeclaration);
    if (root.length > 0) {
      return root.find(j.ObjectExpression)?.at(0);
    }
    return null;
  }

  // get module.exports root node
  private getModuleExportsRoot(sourceCode: string) {
    const root = j(sourceCode).find(j.AssignmentExpression, {
      left: {
        object: {
          name: 'module'
        },
        property: {
          name: 'exports'
        }
      }
    });
    if (root.length > 0) {
      return root.find(j.ObjectExpression)?.at(0);
    }
    return null;
  }

  /**
   * set value to ast-tree
   *
   * ex. setValue('build.publicPath', 'http://xxx.com')
   * more -> setValue('...', '...').toSource() to get transformed string
   * @param propName
   * @param value
   * @returns
   */
  setValue(propName: string, value: any) {
    if (!this.astRoot) return this;
    const props = propName.split('.');
    if (props.length === 0) {
      return this;
    }
    const astValueNode = this.createValueNode(value);
    // the prop is already has a value
    if (this.getNode(propName) !== undefined) {
      const node = this.getNode(propName)!;
      // at(0) will safely get only one node
      node.at(0).forEach(nodePath => {
        // change the value
        nodePath.node.value = astValueNode;
      });
    } else {
      const node = this.getOrCreateNode(propName);
      node?.at(0).forEach(item => {
        item.node.value = astValueNode;
      });
    }
    return this;
  }

  /**
   * get transformed string
   * @returns
   */
  toSource(): string {
    if (!this.astRoot) return '';
    return this.astRoot.toSource();
  }

  private getOrCreateNode(propName: string): j.Collection<namedTypes.Property> | undefined {
    if (!this.astRoot) return;
    const props = propName.split('.');
    let currentNode: j.Collection<any> = this.astRoot;
    for (let i = 0; i < props.length; i++) {
      let propNode = this._getPropNode(currentNode, props[i]);
      // if there is not a named node, create one
      if (propNode.length === 0) {
        const newNode = j.property('init', j.identifier(props[i]), j.objectExpression([]));
        currentNode.at(0).forEach(item => {
          console.log(item.node);
          // item.type === 'ObjectExpression'
          if (item?.node?.properties) {
            item.node.properties.push(newNode);
            // item.type === 'Property'
          } else if (item?.node?.value?.properties) {
            item.node.value.properties.push(newNode);
          }
        });
        currentNode = this._getPropNode(currentNode, props[i]);
      } else {
        currentNode = propNode;
      }
    }
    return currentNode;
  }

  /**
   * given a value(object\array\string\number...) then output ast node
   * @param value
   * @returns
   */
  private createValueNode(
    value: any
  ):
    | namedTypes.Literal
    | namedTypes.ArrayExpression
    | namedTypes.ObjectExpression
    | namedTypes.Identifier {
    if (typeof value === 'object') {
      if (value instanceof RegExp || value === null) {
        return j.literal(value);
      }
      if (Array.isArray(value)) {
        return j.arrayExpression(
          value.map(item => {
            return this.createValueNode(item);
          })
        );
      } else {
        // create normal object
        return j.objectExpression(
          Object.keys(value).map(key => {
            const v = value[key];
            return j.property('init', j.identifier(key), this.createValueNode(v));
          })
        );
      }
    }

    if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
      return j.literal(value);
    }
    return j.identifier('undefined');
  }

  /**
   * get value from ast-tree
   *
   * ex. getProp<string>('build.publicPath')
   * @param propName
   * @returns
   */
  getValue<T>(propName: string): T | undefined {
    if (!this.astRoot) return;
    const node = this.getNode(propName);
    if (!node) return;
    return this.getNodeValue(node?.get()?.node?.value);
  }

  private getNode(propName: string): j.Collection<namedTypes.Property> | undefined {
    if (!this.astRoot) return;
    const props = propName.split('.');
    if (props.length === 0) {
      return;
    }
    let propNode = this._getPropNode(this.astRoot, props[0]);
    for (let i = 1; i < props.length; i++) {
      propNode = this._getPropNode(propNode, props[i]);
    }
    if (propNode.length === 0) {
      return;
    }
    return propNode;
  }

  /**
   * get single node value
   * @param node
   * @returns
   */
  private getNodeValue(node?: j.Node | null) {
    if (!node) {
      return;
    }
    if (node.type === 'ArrayExpression') {
      return (node as j.ArrayExpression).elements.map(item => this.getNodeValue(item));
    }
    if (node.type === 'Literal') {
      return (node as j.Literal).value;
    }
    if (node.type === 'ObjectExpression') {
      const obj: any = {};
      (node as j.ObjectExpression).properties.forEach(item => {
        if (item.type === 'Property') {
          obj[(item.key as j.Identifier)?.name] = this.getNodeValue(item.value);
        }
      });
      return obj;
    }
  }

  // get single prop
  private _getPropNode(node: j.Collection<any>, propName: string) {
    return node.find(j.Property, {
      key: {
        name: propName
      }
    });
  }
}
