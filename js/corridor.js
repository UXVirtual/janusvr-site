


/*

Break execution and spawn a debugger by adding the following line anywhere in your code:

debugger;

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

 Use the following to listen for keyboard events:
 room.onKeyDown = function(event) {
 if (event.keyCode == "1"){
    doSomething();
 }
 };

 JS: New player attributes exposed for the cursor: player.[cursor_pos, cursor_xdir, cursor_ydir, cursor_zdir]!
 A quick one line example showing how to move an Object over to the cursor position:
 room.objects["megaman"].pos.x = player.cursor_pos.x;
 room.objects["megaman"].pos.y = player.cursor_pos.y + 1;
 room.objects["megaman"].pos.z = player.cursor_pos.z;


 */

/*room.rotateObjectClockwise = function(objectId,speed){
    room.objects[objectId].xdir.x -= speed;
    room.objects[objectId].xdir.z += speed;
    room.objects[objectId].zdir.x -= speed;
    room.objects[objectId].zdir.z -= speed;
}*/

/**
 * Animation Class
 *
 * Create an Animation object with a js_id of the object to be animated
 * addKey to add keyframes
 * start to begin animation
 * call animate in room.update
 *
 */

// pass in the js_id of the object to animate
function Animation(target){
    this.keys = new Array();    // key frames
    this.real_start = 0;        // the actual time when the animation starts
    this.relative = 0;          // relative time, where start =0
    this.loop = false;          // loop?
    this.last_key = -1;
    this.target = target;          //js_id of the target object we're animating
    this.on = false;
    this.msg = "";
}

// takes a boolean and sets whether we're looping
Animation.prototype.setLoop = function(loop){
    this.loop = loop;
}

Animation.prototype.addKey =function(keyframe){
    this.keys[this.keys.length]=keyframe;
};

Animation.prototype.start= function(){
    this.real_start = Date.now();
    this.relative =0;
    this.on = true;
    this.last_key=-1;   // in case we're restarting
};

Animation.prototype.isOn = function(){
    return this.on;
}

Animation.prototype.getStatus = function(){
    return "keys: "+this.keys.length + ", targ: "+this.target+", lk:"+ this.last_key +", t: "+this.relative +", m: "+this.msg;
};

Animation.prototype.animate = function(){
    var lkey;
    var rkey;
    var lv;
    var rv;
    var iv;
    var tV = Vector(0,0,0);
    this.msg = "";

    if (! this.on) return;  // if we're not running just exit

    var numk = this.keys.length;
    if (numk<2) return; // 2 keys minimum

    this.relative = Date.now()-this.real_start;

    // are we at the last key
    /**if (this.last_key+1 == numk){
        // we're at the last key
        if (! this.loop) {
            this.msg += "DONE!";
            return;
        } // no animation, we're done.
    } else **/
    if (this.last_key+2 == numk){
        // one more to go, check if we've passed the last key
        if (this.relative > this.keys[this.last_key+1].time ){
            if (this.loop){
                this.last_key=0;
                this.start();
                return;

            }
            this.on = false;
            return; // we're done
        }
    } else if (this.last_key == -1){
        // we're at the first key
        this.last_key = 0;
    } else {
        // we're somewhere in the middle
        if (this.relative > this.keys[this.last_key+1].time ){
            this.last_key++;
        }
    }

    lkey = this.keys[this.last_key];
    rkey = this.keys[this.last_key+1];

    lv = lkey.getTime();
    rv = rkey.getTime();
    if (rv-lv<=0) {this.msg = "DIV ERROR"; return;} // divide by 0 error
    iv = (this.relative-lv)/(rv-lv);

    for (var j=0;j<lkey.numProps();j++){
        // check both keys have type
        if (lkey.getProp(j).getType() == rkey.getProp(j).getType()){

            // interpolate.  Right now hard wired for V3 values
            tV = this.interpolate(lkey.getProp(j).getValue(), rkey.getProp(j).getValue(), iv);

            if (lkey.getProp(j).getType() == "pos") room.objects[this.target].pos = tV;
            else if (lkey.getProp(j).getType() == "col") room.objects[this.target].col = tV;
            else if (lkey.getProp(j).getType() == "scale") room.objects[this.target].scale = tV;
            else if (lkey.getProp(j).getType() == "fwd") {
                room.objects[this.target].fwd = tV;
                room.objects["status2"].text = tV;

            }
            else if (lkey.getProp(j).getType() == "xdir") room.objects[this.target].xdir = tV;
            else if (lkey.getProp(j).getType() == "ydir") room.objects[this.target].ydir = tV;
            else if (lkey.getProp(j).getType() == "zdir") room.objects[this.target].zdir = tV;

        }
    }
};


Animation.prototype.interpolate = function(vl, vr, f){
    // in the future, check type?

    tV = translate(scalarMultiply(vl, 1-f), scalarMultiply(vr, f));

    return tV;
};

/**
 * AnimProperty
 *
 * Holder class for animatable properties, which have a type and a value
 *
 */
function AnimProperty(ptype, v){
    this.ptype = ptype;     // property type
    this.value = v;         // property value

    this.vectorTypes = ["pos","scale","col","fwd","xdir","ydir","zdir"];
    if (this.vectorTypes.indexOf(ptype) != -1) {
        this.subtype = "V3";
    }
}

AnimProperty.prototype.getType = function(){
    return this.ptype;
};
AnimProperty.prototype.getValue = function(){
    return this.value;
};

/**
 * Keyframe Class
 *
 * Create with a time, and then add one or more AnimProperties that you want animated
 * Contain one ore more AnimProperties
 *
 */
// for now, only pass in a time in ms, intype/outype are ignored
function Keyframe(time){
    this.time = time;           // the time of the keyframe in ms
    this.props = new Array();   // array of AnimProperty
}

Keyframe.prototype.addProp = function(value){
    this.props[this.props.length] = value;
};

Keyframe.prototype.numProps = function(){
    return this.props.length;
};

Keyframe.prototype.getTime = function(){
    return this.time;
};

Keyframe.prototype.getProp = function(i){
    if (this.props.length > 0 && (i >=0 && i<= this.props.length)) return this.props[i];
    return false;
};


// END Animation Classes

room.onLoad = function(){

    //debugger;
    //print('test');


    room.pause = false;

    // make a new animation for the object with js_id sphere2
    room.gunMachine = new Animation("gunMachine");

    // make a keyframe for time 0
    var k1 = new Keyframe(0);
    // add two properties to animate to that keyframe
    k1.addProp(new AnimProperty("scale", Vector(1,1,5)));
    k1.addProp(new AnimProperty("pos", Vector(0, 4, -10)));

    // make a keyframe for time 5000
    var k2 = new Keyframe(5000);
    k2.addProp(new AnimProperty("scale", Vector(1,4,4)));
    k2.addProp(new AnimProperty("pos", Vector(-10, 4, -15)));

    var k3 = new Keyframe(10000);
    k3.addProp(new AnimProperty("scale", Vector(1,5,1)));
    k3.addProp(new AnimProperty("pos", Vector(-10, 40, -15)));

    var k4 = new Keyframe(15000);
    k4.addProp(new AnimProperty("scale", Vector(5,1,1)));
    k4.addProp(new AnimProperty("pos", Vector(20, 40, -15)));

    var k5 = new Keyframe(20000);
    k5.addProp(new AnimProperty("scale", Vector(1,1,5)));
    k5.addProp(new AnimProperty("pos", Vector(0, 4, -10)));

    // add all the keframes to the animation object
    room.gunMachine.addKey(k1);
    room.gunMachine.addKey(k2);
    room.gunMachine.addKey(k3);
    room.gunMachine.addKey(k4);
    room.gunMachine.addKey(k5);

    // tell it to loop
    room.gunMachine.setLoop(true);

    // start the animation
    room.gunMachine.start();
}

room.onUpdate = function(){



    // tell the animations to animate.  Need to adjust for fps time later
    room.gunMachine.animate();


    // debug helper
    /*if (room.objects["status"].text != "") {
        var msg = " ";
        msg += "pos: "+room.objects["sphere2"].pos;
        msg += ", scale: "+room.objects["sphere2"].scale;
        room.objects["status"].text = msg;

    }*/

    //room.rotateObjectClockwise("gun-machine",0.1);
}