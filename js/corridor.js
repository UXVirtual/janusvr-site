/*

Access the player object via room.player
room.player.pos.x
 room.player.pos.y
 room.player.pos.z

Access list of AssetObjects in the room via room.objects array
room.objects["AssetObjectId"] (may or may not need to expose via js_id attribute of AssetObject

 child.pos.x = this.currentPosition[0];
 child.pos.y = this.currentPosition[1];
 child.pos.z = this.currentPosition[2];
 child.xdir.x = this.UPR[0];
 child.xdir.y = this.UPR[1];
 child.xdir.z = this.UPR[2];
 child.ydir.x = this.UPR[3];
 child.ydir.y = this.UPR[4];
 child.ydir.z = this.UPR[5];
 child.zdir.x = this.UPR[6];
 child.zdir.y = this.UPR[7];
 child.zdir.z = this.UPR[8];

 Set an object's collision_id to the AssetObject id to use that object's geometry as its collision box

 Objects support JavaScript events such as onclick i.e.
 onclick="room.functionName()"

 The room.update() callback function can be defined to run code on every update of the game engine. i.e:

 room.update = function() {

 }


 */

room.rotateObjectClockwise = function(objectId,speed){
    room.objects[objectId].xdir.x -= speed;
    room.objects[objectId].xdir.z += speed;
    room.objects[objectId].zdir.x -= speed;
    room.objects[objectId].zdir.z -= speed;
}

room.onLoad = function(){
    //room.debugTxt
}

room.onUpdate = function(){


    room.rotateObjectClockwise("gun-machine",0.1);
}