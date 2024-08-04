export class SHandleOperator extends Communicator.Operator.OperatorBase {
  constructor(viewer, manager) {
    super(viewer);
    this._viewer = viewer;
    this._manager = manager;
    this._startmatrix = null;
    this._selectedHandleGroup = null;
    this._isClick = false;
    this.oldNodeId = null;
    this.isHandled = false;
  }

  setHandled(event) {
    return this.isHandled;
  }

  async onMouseDown(event) {
    this.isHandled = false;
    await super.onMouseDown(event);
    this._selectedHandleGroup = null;
    this._isClick = true;

    let config = new Communicator.PickConfig(Communicator.SelectionMask.Line);
    config.restrictToOverlays = true;
    const selection = await this._viewer.view.pickFromPoint(event.getPosition(), config);
    if (selection.getPosition()) {
      // ViewerUtility.createDebugCube(this._viewer,selection.getPosition(),1,undefined);
      let nodeid = this._viewer.model.getNodeParent(selection.getNodeId());
      let topnode = this._viewer.model.getNodeParent(nodeid);

      let handleGroup = this._manager.getHandleGroup(topnode);

      if (handleGroup) {
        this._selectedHandleGroup = handleGroup;
        this._selectedHandle = handleGroup.getHandle(nodeid);

        await this._selectedHandle.handleMouseDown(event, selection);
        this.oldColor = [this._selectedHandle._color.copy()];
        this._viewer.model.setNodesFaceColor([nodeid], new Communicator.Color(255, 255, 0));
        this.oldNodeId = nodeid;
        this.isHandled = true;
        event.setHandled(true);
      }
    }
  }

  async onMouseMove(event) {
    await super.onMouseMove(event);
    this._isClick = false;

    if (this._selectedHandleGroup) {
      await this._selectedHandle.handleMouseMove(event);
      await this._manager.refreshAll(this._selectedHandleGroup);
      this.isHandled = true;
      event.setHandled(true);
    } else {
      if (this.oldNodeId) {
        this._viewer.model.setNodesFaceColor([this.oldNodeId], this.oldColor[0]);
        this.oldNodeId = null;
      }

      let config = new Communicator.PickConfig(Communicator.SelectionMask.Face);
      config.restrictToOverlays = true;
      const selection = await this._viewer.view.pickFromPoint(event.getPosition(), config);
      if (selection.getPosition()) {
        //            ViewerUtility.createDebugCube(this._viewer,selection.getPosition(),1,undefined);
        let nodeid = this._viewer.model.getNodeParent(selection.getNodeId());
        let topnode = this._viewer.model.getNodeParent(nodeid);

        let handleGroup = this._manager.getHandleGroup(topnode);

        if (handleGroup) {
          this.oldColor = await this._viewer.model.getNodesFaceColor([nodeid]);
          this.oldNodeId = nodeid;
          this._viewer.model.setNodesFaceColor([nodeid], new Communicator.Color(255, 255, 0));
        }
      }
    }
  }

  async onMouseUp(event) {
    await super.onMouseUp(event);
    if (this._selectedHandleGroup) {
      this._viewer.model.setNodesFaceColor([this._selectedHandle._nodeid], this.oldColor[0]);
      this._selectedHandleGroup = null;
    }

    if (this.oldNodeId) {
      this._viewer.model.setNodesFaceColor([this.oldNodeId], this.oldColor[0]);
      this.oldNodeId = null;
    }

    if (this._isClick) {
      await this._manager.remove();
    }
  }
}
