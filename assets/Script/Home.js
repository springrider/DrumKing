cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null, type: cc.Label
        },
        bpmLabel: {
            default: null, type: cc.Label
        },

        resultLabel: {
            default: null, type: cc.Label
        },
        drumConn: {
            default: null, type: cc.Label
        },


        scoreVal: {
            default: null,
            type: cc.Label
        },
        winClip: {
            default: null,
            url: cc.AudioClip
        },
        loseClip: {
            default: null,
            url: cc.AudioClip
        },
        countDown: {
            default: null,
            url: cc.AudioClip
        },


        metronomeUp: {
            default: null,
            url: cc.AudioClip
        },
        metronome: {
            default: null,
            url: cc.AudioClip
        },

        music: {
            default: null,
            url: cc.AudioClip
        },


        drumAnim: cc.Sprite,
        drum: cc.Sprite,
        beatPrefab: cc.Prefab,
        // defaults, set visually when attaching this script to the Canvas
        text: 'Score:'
    },
  
    playCountDown: function(){

        cc.audioEngine.play(this.countDown);
        this.latencyCheck = Date.now()
    },

    playSound: function(){
      //console.log("play");
       //cc.audioEngine.play( this.metronomeUp, false ,1);
      //console.log("last:"+this.lastTime)
      this.elapsedMs = Date.now() - this.startTime;
      let delta = this.beatTime[this.beatCount][1] - this.elapsedMs;
      console.log("executed:"+this.executed+",elaps:"+this.elapsedMs+",beattime:"+this.beatTime[this.beatCount][1]+",diff:"+delta)
      this.startTime -= delta;
      //this.startTime += this.latency;
      console.log(Date.now()-this.lastTime);
      this.lastTime = Date.now();
      if(this.beatCount % 4 ==0){
        //cc.audioEngine.play( cc.url.raw("resources/Sound/metronomeUp.mp3"), false ,1);
        cc.audioEngine.play( this.metronomeUp);
      }
      else{
        //cc.audioEngine.play( cc.url.raw("resources/Sound/metronome.mp3"), false ,1);
        cc.audioEngine.play(this.metronome);
      }
      //console.log("count:"+this.beatCount)
      this.beatCount++;
      console.log(this.beatCount, this.totalBpm);
      if(this.beatCount == this.totalBpm){
          this.levelFinish();
      }
    },
    
    hitTest: function(){
      
      let now = Date.now();
      let gap = 10000;
      let beat = 0;
      this.elapsedMs = Date.now() - this.startTime;
      for(let i = this.beatCount - 1; i <= this.beatCount + 1; i++){
        if(i < 0 || i >= this.totalBpm) continue;

        let tmpGap = Math.abs(this.elapsedMs  - this.beatTime[i][1])
        if( tmpGap < gap){
            gap = tmpGap;
            beat = i;
        }
      }

      console.log("lasttime:"+this.lastTime+", elap:"+this.elapsedMs+", beattime:"+this.beatTime[beat][1]+",count:"+beat+",gap:"+gap)
      //let gap = Math.abs(now - this.lastTime);
      let score = 0;
      if( gap < 35){
        score = 100;
      } 
      else if( gap < 55){
        score = 90;
      }
      else if(gap < 50){
        score = 80;
      }
      else if(gap < 70){
        score = 80;
      }
      else{
        score = 80 - (gap - 70)
        if(score < 0 ){
            score = 0;
        }
      }
      console.log("count:"+i+"!!!!Score:"+score)
      this.beatScore[beat] = score;

    },
    slient: function(){
      this.unschedule(this.beatCallback)
      //clearInterval(this.timer)
    },
    loadCB : function(msg){
        console.log("preload ok"+msg);
    },


    startBeat: function(){
        //this.timer = setInterval(this.playSound.bind(this), this.lap);
        this.beatCallback = this.playSound.bind(this)
        this.schedule(this.beatCallback, this.lap/1000, cc.macro.REPEAT_FOREVER, 0);
        this.startTime = Date.now()
    },
    playMusic: function(){
      if(this.onGoing) return;
      this.onGoing = true;
      var audioID = cc.audioEngine.play(this.music);
        this.scheduleOnce(()=>{
          cc.audioEngine.stop(audioID);
          this.onGoing = false;
        }, 67);
    },

    prepare: function(){

        this.schedule(this.playCountDown.bind(this), this.lap/1000, 3, 0)
        /*
        setTimeout(this.playSound.bind(this), 0);
        setTimeout(this.playSound.bind(this), 1*this.lap);
        setTimeout(this.playSound.bind(this), 2*this.lap);
        setTimeout(this.playSound.bind(this), 3*this.lap);
        */

        this.scheduleOnce(()=>{
          this.beatCount = 0;
          //this.elapsedMs = 0;
          this.startBeat();
        }, 4*(this.lap/1000));
    },

    levelFinish: function () {
      this.onGoing = false;
      this.slient();
      let scores = Object.values(this.beatScore)
      let score = Math.ceil(scores.reduce( (a,b) => a + b, 0 ) / scores.length);
      this.scoreVal.string = score;
      if(score > 70){
        this.resultLabel.node.active = true
        this.resultLabel.string = "Congrats! Tap i to the next level";
        this.bpm += 5;
        this.bpmLabel.string = "bpm:"+this.bpm
        this.drumAnim.node.active = true;
        var anim = this.getComponent(cc.Animation);
        let animState = anim.play();
        animState.wrapMode = cc.WrapMode.Loop;
        animState.repeatCount = 2;
        cc.audioEngine.play( this.winClip);

      }
      else{
        this.resultLabel.node.active = true
        this.resultLabel.string = "failed, Tap i to retry";

        cc.audioEngine.play( this.loseClip);
      }
      
      //console.log(this.beatScore)
    },

    initLevel: function () {
        if(this.onGoing){
          console.log("game is ongoing");
          return;
        }
        this.onGoing = true; 
        this.drumAnim.node.active = false;
        this.lastTime = Date.now();
        this.beatCount = 0;
        this.beatTime = {};
        this.beatScore = {};
        this.totalBpm = this.bpm * 1;
        this.lap = Math.floor((60/this.bpm)*1000);
        this.prepare();

        this.resultLabel.node.active = false

        
        for(let i=0; i<this.totalBpm; i++){
          this.beatScore[i] = 0;
        }
        for(let i=0; i<this.totalBpm; i++){
          this.beatTime[i] = [0,(i+1)*this.lap];
        }
        console.log(this.beatTime)
    },

    // use this for initialization
    onLoad: function () {
        this.onGoing = false;
        this.latency = 129; // for keyboard, it's 0.  for real drum, it is -129.17, at least for mine
        WebMidi.enable((err) => {
        this.drumConn.string = "connect your drum pls"    

        if (err) {
          console.log("WebMidi could not be enabled.", err);
        } else {
            console.log(WebMidi.inputs);
            if(WebMidi.inputs.length > 0){
              this.drumConn.string = "drum connected!" 
              this.drumDev = WebMidi.inputs[0];   
              this.playM = 0;
              // Listen for a 'note on' message on all channels
        this.drumDev.addListener('noteon', "all",
          (e) =>{
            let note = e.note.name + e.note.octave;
            if(note == 'D1'){
                this.hitTest()
            }
            else if(note == 'A1'){
              this.playM++;
            }
            else if(note == 'D#2'){
                this.initLevel();
            }
            else if(note == 'A#1'){
                let latency = Date.now() - this.latencyCheck
                console.log('latency:'+latency);
 
            }
            if(note != 'A1'){
              this.playM = 0;
            }
            if(this.playM >=5){
              this.playMusic();
              this.playM = 0;
            }

            console.log("Received 'noteon' message (" + note + ").");
          }
        );

            }
            console.log(WebMidi.outputs);
          console.log("WebMidi enabled!");
        }
        
      });

        this.bpm = 80;
        this.bpmLabel.string = "bpm:"+this.bpm
        cc.Audio.useWebAudio = true;
        cc.audioEngine.preload(this.metronome,this.loadCB);
        cc.audioEngine.preload(this.metronomeUp,this.loadCB);
        cc.audioEngine.preload(this.countDown,this.loadCB);
        cc.audioEngine.preload(this.music,this.loadCB);
        this.resultLabel.string = "Tap i to start";
        cc.loader.loadRes("drums/5", cc.SpriteFrame, (err, spriteFrame) => {
          this.badFrame = spriteFrame;
        })

        cc.loader.loadRes("drums/6", cc.SpriteFrame, (err, spriteFrame) => {
          this.normalFrame = spriteFrame;
        })

        cc.loader.loadRes("drums/7", cc.SpriteFrame, (err, spriteFrame) => {
          this.goodFrame = spriteFrame;
        })
         
        //this.label.string = this.text;

      /*
        let beat1 = cc.instantiate(this.beatPrefab);
        this.beat1 = beat1;
        this.beat2 = cc.instantiate(this.beatPrefab);
        this.beat2.parent = this.node;
        beat1.parent = this.node;
        beat1.setPosition(300,85);
        this.startPoint = cc.p(5000,85);
        this.targetPoint = cc.p(-240,85);

        this.startPoint2 = cc.p(1000,100);
        this.targetPoint2 = cc.p(-240,100);
*/
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        /*
        this.beatTime = 3200;
        this.elapsedMs = 0; 
        this.meterPs = this.beatTime / (this.startPoint.x - this.targetPoint.x)
        this.meterPs2 = this.beatTime / (this.startPoint2.x - this.targetPoint2.x)
        */
    },

    onKeyDown:function(event){
        switch(event.keyCode) {
            case cc.KEY.a:
                this.hitTest()
                break;

            case cc.KEY.b:
                console.log('Press a key');
                this.slient()
                break;
            case cc.KEY.i:
                console.log('Press a key');
                this.initLevel();
                break;
            case cc.KEY.j:
                let latency = Date.now() - this.latencyCheck
                console.log('latency:'+latency);
      
                break;



        }
    },

    // called every frame
    update: function (dt) {
        //let ms = dt*1000;
        //this.elapsedMs += ms;
        //console.log(this.elapsedMs);
        /*
        this.beat1.x = this.beat1.position.x-ms*this.meterPs*dt*10;
        this.beat2.x = this.beat2.position.x-ms*this.meterPs2*dt*10;
        */
        //this.beat1.setPosition(p)
    },
});
