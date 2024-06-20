import { StandardHandleGroup } from "./StandardHandleGroup.js";
import { ScaleHandle } from "../Handles/ScaleHandle.js";
import { ScaleAllHandle } from "../Handles/ScaleAllHandle.js";

export class ScaleHandleGroup extends StandardHandleGroup {
  constructor(manager) {
    super(manager);
  }

  async show(nodeids, center = null, rotation = null) {
    await super.show(nodeids, center, rotation);

    const axisHandles = this._axisHandles;

    if (
      !axisHandles ||
      (axisHandles && axisHandles.includes(Communicator.Axis.X))
    ) {
      this._handles.push(
        new ScaleHandle(
          this,
          new Communicator.Point3(0, 1, 0),
          90,
          new Communicator.Color(0, 200, 0)
        )
      );
    }

    if (
      !axisHandles ||
      (axisHandles && axisHandles.includes(Communicator.Axis.Y))
    ) {
      this._handles.push(
        new ScaleHandle(
          this,
          new Communicator.Point3(1, 0, 0),
          -90,
          new Communicator.Color(255, 0, 0)
        )
      );
    }

    if (
      !axisHandles ||
      (axisHandles && axisHandles.includes(Communicator.Axis.Z))
    ) {
      this._handles.push(
        new ScaleHandle(this, null, 0, new Communicator.Color(0, 0, 255))
      );
    }

    this._handles.push(
      new ScaleAllHandle(this, new Communicator.Color(255, 255, 255))
    );

    for (let i = 0; i < this._handles.length; i++) {
      await this._handles[i].show();
    }
  }
}
