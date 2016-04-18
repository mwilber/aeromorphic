function CloudArtist(options){
	
	this.spriteData = options.sprite_data;
	
    this.OUTER_MARGIN = 10;
	this.CLOUD_JITTER = options.cloud_jitter;
	this.MAX_DIAMETER = options.max_diameter;
	this.AIR_FRICTION = options.air_friction;
	this.PARTICLE_DISSIPATE = options.particle_dissipate;
	this.SHOW_ALPHA = options.show_alpha;
	this.BREEZE_BOUND = 20;
	this.BREEZE_POWER = 0.4;
	this.WIND_BOUND = 5;
	this.WIND_POWER = 0.799;

    this.canvas = options.element;

    this.stage; this.cloud; this.resetTimer; this.background; this.circles;
	this.cloudid = 0;
	this.resetCount = 100;
	this.mousePos = {
		"x":0,
		"y":0
	};
	this.mousePosOld = {
		"x":0,
		"y":0
	};
	this.dataStart = null;


    this.stage = new createjs.Stage(this.canvas.id);
    this.stage.setBounds(0,0,this.canvas.width, this.canvas.height)

	createjs.Touch.enable(this.stage);
	this.stage.mouseEnabled = true;
	
	this.scale = this.canvas.width/300;
	
	this.cloudSprite = new createjs.SpriteSheet(this.spriteData);
	
	this.background = this.stage.addChild( new createjs.Shape());
	this.background.graphics.beginFill(options.backgroundColor).drawRect(0, 0, this.canvas.width, this.canvas.height);
	console.log(options.backgroundColor, this.canvas);
	
	this.cloud = this.stage.addChild(new createjs.Container());
	
	// the pressmove event is dispatched when the mouse moves after a mousedown on the target until the mouse is released.
	this.stage.on("pressmove", this.PressMove(this));
	this.stage.on("pressup", this.PressUp(this));
	this.stage.on("stagemousedown", this.PressDown(this));
	
	
	//createjs.Ticker.on("tick", this.Tick(this));
	createjs.Ticker.on("tick", this.CircleJerk(this));
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.setFPS(24);
	
	this.circles = new Array();
}

CloudArtist.prototype.SetBackground = function(pImg){

    var tmpbkg = new createjs.Bitmap(pImg);
    tmpbkg.x = 0;
    tmpbkg.y = 0;
    tmpbkg.rotation = 0;

    this.stage.addChild(tmpbkg);
};

CloudArtist.prototype.PressMove = function(self){
	return function(evt){
		self.mousePosOld.x = self.mousePos.x;
		self.mousePosOld.y = self.mousePos.y;
		self.mousePos.x = evt.stageX;
		self.mousePos.y = evt.stageY;
		//ShowPosition();
	};
};

CloudArtist.prototype.PressUp = function(self){
	return function(evt){
		self.mousePosOld.x = 0;
		self.mousePosOld.y = 0;
		self.mousePos.x = 0;
		self.mousePos.y = 0;
		//ShowPosition();
	};
};

CloudArtist.prototype.PressDown = function(self){
	return function(evt){
		self.mousePosOld.x = evt.stageX-10;
		self.mousePosOld.y = evt.stageY-10;
		self.mousePos.x = evt.stageX;
		self.mousePos.y = evt.stageY;
		//ShowPosition();
	};
};

CloudArtist.prototype.Tick = function(self, event) { 
	return function(){
		self.stage.update(event);
	};
};

CloudArtist.prototype.Destroy = function(){
    
    this.stage.enableDOMEvents(false);
    this.stage.removeAllChildren();
    this.stage.clear();
    this.stage.update();
    
    return true;

};

CloudArtist.prototype.InitCloud = function(response){
	
	console.log(response);
	
	this.cloudid = response.id;
	$('#cloudid').val(this.cloudid);
	
	var a = 1;
    var b = 2;
	var centerx = 300 / 2;
	var centery = 300 / 2;

    response.data.cloudDataFinish = Array();
	
    for (i = 0; i < 300; i+=2) {
        angle = 0.1 * i;
        x = centerx + (a + b * angle) * Math.cos(angle);
        y = centery + (a + b * angle) * Math.sin(angle);
        y = y*.75;
		response.data.cloudDataFinish.push({"x":x,"y":y,"d":(Math.random()/2)});
    }
	for (i = 600; i > 300; i-=2) {
        angle = 0.1 * i;
        x = centerx + (a + b * angle) * Math.cos(angle);
        y = centery + (a + b * angle) * Math.sin(angle);
    	y = y*.75;
	 	response.data.cloudDataFinish.push({"x":x,"y":y,"d":(Math.random()/2)});
    }
	
	this.LoadCloud(response.data.cloudDataFinish);
};

CloudArtist.prototype.LoadCloud = function(pData){
	
	//console.log(pData);
	
	this.dataStart = pData;
	this.cloud.removeAllChildren();

	for(var idx in this.dataStart){
		
		this.circles[idx] = new createjs.Container();
		this.circles[idx].setTransform(this.dataStart[idx].x*this.scale-0,this.dataStart[idx].y*this.scale+100);
		this.circles[idx].v = {x:0,y:0};
		this.circles[idx].d = this.dataStart[idx].d;
		this.circles[idx].clsprite = new createjs.Sprite(this.cloudSprite);
		this.circles[idx].clsprite.x = -100;
		this.circles[idx].clsprite.y = -100;
		this.circles[idx].addChild(this.circles[idx].clsprite);
		
		
		this.cloud.addChild(this.circles[idx]);
	}

	this.stage.update();
};

CloudArtist.prototype.AnimateCloud = function(self){
	
	return function(pData){
		console.log(pData);
		// for(var idx in pData){
			
		// 	this.circles[idx].x = pData[idx].x*this.scale;
		// 	this.circles[idx].y = pData[idx].y*this.scale;
		// 	this.circles[idx].d = pData[idx].d;
		// }
		//this.stage.update();
		
		self.resetCount = 1000;
		self.resetTimer = setInterval(function(){
			console.log(self.resetCount);
			if( self.resetCount > 0 ){
				for(var idx in self.dataStart){
					
					var tmpLoc = self.TransformVector(self.circles[idx],{x:pData[idx].x*self.scale, y:pData[idx].y*self.scale},0.01);
					var tmpD = self.circles[idx].d;
					
					if( tmpD > pData[idx].d ){
						tmpD -= .001;
					}
					// Reset the size
					self.circles[idx].x = tmpLoc.x;
					self.circles[idx].y = tmpLoc.y;
					// Reset the delta
					self.circles[idx].d = tmpD;
					// Reset the appearance based on delta
					//self.circles[idx].scaleX = self.circles[idx].d;
					//self.circles[idx].scaleY = self.circles[idx].d;
					//if(SHOW_ALPHA) self.circles[idx].alpha = 1-(self.circles[idx].d-1);
				}
				self.resetCount--;
				self.stage.update();
			}else{
				clearInterval(self.resetTimer);
			}
		},5);
	
	};
	
};

CloudArtist.prototype.TransformVector = function(pA,pB,pT){
	var rX;
	var rY;
	
	rX = pA.x + (pB.x-pA.x)*pT;
	rY = pA.y + (pB.y-pA.y)*pT;
	
	return {x:rX,y:rY};
};

CloudArtist.prototype.getDistance = function( point1, point2 ){
  var xs = 0;
  var ys = 0;

  xs = point2.x - point1.x;
  xs = xs * xs;

  ys = point2.y - point1.y;
  ys = ys * ys;

  return Math.sqrt( xs + ys );
};

CloudArtist.prototype.ScaleVector = function(pV, pL){
	vMagnitude = Math.sqrt(pV.x*pV.x + pV.y*pV.y);
	pV.x = pL * pV.x / vMagnitude;
	pV.y = pL * pV.y / vMagnitude;
	
	return {x:pV.x,y:pV.y};
};

CloudArtist.prototype.CircleJerk = function(self, pCircle) { 
	return function(){
		//console.log('test');
		$.each(self.cloud.children,function(idx, val){
			var pCircle = val;
			//console.log(idx, val, pCircle);
			pCircle.x -= pCircle.v.x;
			pCircle.y -= pCircle.v.y;

			pCircle.v = self.TransformVector(pCircle.v,{x:0,y:0},self.AIR_FRICTION);
			
			if(pCircle.d < 0.5){
				pCircle.d += (self.getDistance({x:0,y:0},pCircle.v)*self.PARTICLE_DISSIPATE);
			}
			
			if( Math.floor((pCircle.d)*100) < 50){
				pCircle.clsprite.gotoAndStop(Math.floor((pCircle.d)*100));
			}

			var pt = pCircle.globalToLocal(self.mousePos.x, self.mousePos.y);
			var dpt = self.getDistance({x:0,y:0},pt);
			if ( dpt < (self.WIND_BOUND*self.scale)) {
				pt = self.ScaleVector(pt, (self.WIND_BOUND*self.scale)-dpt);
				// Vector set by pointer in relation to target
				pCircle.v = {x:(pCircle.v.x+pt.x),y:(pCircle.v.y+pt.y)};
				
				// Vector set by combination of pointer vector and target vector
				pCircle.v = self.TransformVector(pCircle.v,{x:-(self.mousePos.x-self.mousePosOld.x),y:-(self.mousePos.y-self.mousePosOld.y)},self.WIND_POWER);
				
				pCircle.v = self.TransformVector({x:0,y:0},pCircle.v,self.WIND_POWER);
				
				// Apply the speed limit
				if( self.getDistance({x:0,y:0},pCircle.v) > self.SPEED_LIMIT ){
					self.ScaleVector(pCircle.v, self.SPEED_LIMIT);
				}
				
			}else if ( dpt < (self.BREEZE_BOUND*self.scale)) {  
				pt = self.ScaleVector(pt, (self.BREEZE_BOUND*self.scale)-dpt);
				// Vector set by pointer in relation to target
				pCircle.v = {x:(pCircle.v.x+pt.x),y:(pCircle.v.y+pt.y)};
				
				pCircle.v = self.TransformVector({x:0,y:0},pCircle.v,self.BREEZE_POWER);
				
			}
		});
		self.stage.update(event);
	};
};

CloudArtist.prototype.ResetCloud = function(self){
	
	return function(){
		self.resetCount = 100;
		self.resetTimer = setInterval(function(){
			if( self.resetCount > 0 ){
				for(var idx in self.dataStart){
					
					var tmpLoc = TransformVector(self.circles[idx],{x:self.dataStart[idx].x*self.scale, y:self.dataStart[idx].y*self.scale},0.1);
					var tmpD = self.circles[idx].d;
					
					if( tmpD > self.dataStart[idx].d ){
						tmpD -= .01;
					}
					// Reset the size
					self.circles[idx].x = tmpLoc.x;
					self.circles[idx].y = tmpLoc.y;
					// Reset the delta
					self.circles[idx].d = tmpD;
					// Reset the appearance based on delta
					self.circles[idx].scaleX = self.circles[idx].d;
					self.circles[idx].scaleY = self.circles[idx].d;
					if(SHOW_ALPHA) self.circles[idx].alpha = 1-(self.circles[idx].d-1);
				}
				self.resetCount--;
			}else{
				clearInterval(self.resetTimer);
			}
		},10);
	};
};

CloudArtist.prototype.SaveCloud = function(self){
    
    return function(){
    	if( lsUserId > 0 ){
        	//panel['save'].Load();
       }else{
       	alert('user login here: '+lsUserId);
       }
    };
};

CloudArtist.prototype.SerializeCloud = function(){
	var result = [];
	for(var idx in this.circles){
		result.push({
			x:Math.floor(this.circles[idx].x/this.scale),
			y:Math.floor(this.circles[idx].y/this.scale),
			d:this.circles[idx].d
		});
	}
	//return JSON.stringify(result);
	return result;
};

CloudArtist.prototype.Export = function(){
	return this.stage.canvas.toDataURL("image/png");
};