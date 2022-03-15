import { FilterType } from "../../types";

/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 export default class Tree {

  private root: TreeNode | null

  constructor(data: FilterType) {
    let node = new TreeNode(data);
    this.root = node;
  }
   

  createNewNode = (data: FilterType): TreeNode => {
    return {
      data,
      parent: null,
      children:[]
    }
  }

   deleteTree = () => {
    // In javascript automatic garbage collection
    // happens, so we can simply make root
    // null to delete the tree
    this.root = null;
  }

  findNode = ( matchingData: FilterType, node : TreeNode | null = this.root ) :  TreeNode | null => {
    if (node){
      //if the current node matches the data, return it
      if(node.data == matchingData)
          return node;
          //recurse on each child node
      for (let child of node.children) {
        //if the data is found in any child node it will be returned here 
        if (this.findNode(matchingData, child))
            return child;
      } 
  }
    //otherwise, the data was not found
    return null;
}
  insertNewNode = (data : FilterType, parentData: FilterType) => {
    let currentNode = this.createNewNode(data)
    let parentNode = this.findNode(parentData);
 
    //if the parent exists, add this node
    if (parentNode) {
        parentNode.children.push(currentNode);
        currentNode.parent = parentNode;
 
        //return this node
        return currentNode;
    }
    //otherwise throw an error
    else {
        throw new Error(`Cannot add node: parent with filter data ${parentData} not found.`);
    }
  }

  //removes the node with the specified filter data from the tree
  removeNode(data: FilterType) {
    //find the node
    let node = this.findNode(data)

       if (node && this.root) {
        if (node.data == this.root.data) {
          this.deleteTree();
        } else { 
          //find the index of this node in its parent
          let parent = node.parent;
          if (parent){ 
            let indexOfNode = parent.children.indexOf(node);
            //and delete it from the parent
            parent.children.splice(indexOfNode, 1);
          }
        //otherwise throw an error
        else {
            throw new Error(`Cannot remove node: node with filter data ${data} not found.`);
        }
        }
    }
  }
}

class TreeNode {
  data: FilterType;
  parent: null| TreeNode;
  children: TreeNode[] ;

  constructor(data: FilterType) {
    this.data = data;
    this.parent = null;
    this.children = [];
  }
}