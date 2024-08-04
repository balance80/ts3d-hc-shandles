export class RotateUndo {
  constructor() {
    this.nodeids = [];
    this.matrices = [];
  }

  gather(viewer, nodeids = null) {
    for (let i = 0; i < nodeids.length; i++) {
      this.nodeids.push(nodeids[i]);
      this.matrices.push(viewer.model.getNodeMatrix(nodeids[i]));
    }
  }

  clone(viewer) {
    let s = new RotateUndo();
    s.gather(viewer, this.nodeids);
    return s;
  }

  async do(viewer) {
    for (let i = 0; i < this.nodeids.length; i++) {
      await viewer.model.setNodeMatrix(this.nodeids[i], this.matrices[i]);
    }
  }
}

export class UndoManager {
  constructor(viewer) {
    this._viewer = viewer;
    this.undoStack = [];
    this.undoTop = 0;

    this.undoPointer = 0;
    this._undoTypes = [];
  }

  setUndoPoint(undoElements) {
    this.undoStack[this.undoPointer] = undoElements;
    this.undoPointer++;
    this.undoTop = this.undoPointer;
  }

  async undo() {
    if (this.undoPointer > 0) {
      if (this.undoPointer == this.undoTop) {
        let s = this.undoStack[this.undoPointer - 1][0].clone(this._viewer);
        this.setUndoPoint([s]);
        this.undoPointer--;
        this.undoTop = this.undoPointer;
      }

      this.undoPointer--;
      for (let i = 0; i < this.undoStack[this.undoPointer].length; i++) await this.undoStack[this.undoPointer][i].do(this._viewer);
    }
  }

  async redo() {
    if (this.undoPointer < this.undoTop) {
      this.undoPointer++;
      for (let i = 0; i < this.undoStack[this.undoPointer].length; i++) await this.undoStack[this.undoPointer][i].do(this._viewer);
    }
  }
}
