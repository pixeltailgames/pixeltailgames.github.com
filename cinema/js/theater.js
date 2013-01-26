/*
	Video Player Types (LEGACY SUPPORT)
	Fully supported player APIs reserve their own enum
*/
var VIDEO_INVALID = 0,
	VIDEO_URL = 1,
	VIDEO_YOUTUBE = 2,
	VIDEO_VIMEO = 3,
	VIDEO_TWITCH = 4,
	VIDEO_HULU = 5,
	VIDEO_BLIP = 6,
	VIDEO_TWITCH_STREAM = 7;

var theater = {

	closedCaptions: false,
	hdPlayback: false,
	language: "en",
	player: null,
	volume: 25,

	getPlayerContainer: function() {
		return document.getElementById('player-container');
	},

	resetPlayer: function() {
		if ( this.player ) {
			this.player.onRemove();
			delete this.player;
		}
		this.getPlayerContainer().innerHTML = "<div id='player'></div>";
	},

	enablePlayer: function() {
		// Show player
		var player = this.getPlayerContainer();
		player.style.display = "block";

		// Hide content
		var content = document.getElementById("content");
		content.style.display = "none";	
	},

	disablePlayer: function() {
		// Hide player
		var player = this.getPlayerContainer();
		player.style.display = "none";

		this.resetPlayer();

		// Show content
		var content = document.getElementById("content");
		content.style.display = "block";
	},

	getPlayer: function() {
		return this.player;
	},

	loadVideo: function( type, data, startTime ) {

		if(swfobject && !swfobject.hasFlashPlayerVersion("1")) return;
		if ( ( type == null ) || ( data == null ) ) return;
		
		if ( type == VIDEO_INVALID ) {
			this.disablePlayer();
			return;
		}

		startTime = Math.max( 0, startTime );

		var player = this.getPlayer();

		// player doesn't exist or is different video type
		if ( (player == null) || (player.getType() != type) ) {

			this.resetPlayer();
			this.enablePlayer();

			var playerObject = getPlayerByType( type );
			if ( playerObject != null ) {
				this.player = new playerObject();
			} else {
				this.getPlayerContainer().innerText = "Video type not yet implemented.";
				return;
			}

		}

		this.player.setVolume( (this.volume != null) ? this.volume : 25 );
		this.player.setStartTime( startTime || 0 );
		this.player.setVideo( data );

	},

	setVolume: function( volume ) {
		this.volume = volume;
		if ( this.player != null ) {
			this.player.setVolume( volume );
		}
	},

	seek: function( seconds ) {
		var player = this.getPlayer();
		if ( player ) {
			player.seek( seconds );
		}
	},

	enableHD: function() {
		this.hdPlayback = true;
	},

	isHDEnabled: function() {
		return this.hdPlayback;
	},

	sync: function( time ) {

		if ( time == null ) return;

		if ( this.player != null ) {

			var current = this.player.getCurrentTime();
			if ( ( current != null ) && ( Math.abs(time - current) > 5 ) ) {
				this.player.setStartTime( time );
			}

		}

	},
	
	setLanguage: function( language ) {
		this.language = language;
	},

	/*
		Google Chromeless player doesn't support closed captions...
		http://code.google.com/p/gdata-issues/issues/detail?id=444
	*/
	enableCC: function() {
		this.closedCaptions = true;
	},

	isCCEnabled: function() {
		return this.closedCaptions;
	},

	clickPlayerCenter: function() {
		var evt = document.createEvent("MouseEvents");

		var player = document.getElementById("player");

		var w = player.clientWidth / 2,
			h = player.clientHeight / 2;

		evt.initMouseEvent("click", true, true, window,
		  0, 0, 0, w, h, false, false, false, false, 0, null);

		this.getPlayer().dispatchEvent(evt);
	}

};


var players = [];

function getPlayerByType( type ) {
	return players[ type ];
};

function registerPlayer( type, object ) {

	object.prototype.player = null;
	
	object.prototype.lastVideoId = null;
	object.prototype.videoId = null;

	object.prototype.lastVolume = null;
	object.prototype.volume = 0.123;

	object.prototype.currentTime = 0;

	object.prototype.getCurrentTime = function() {
		return null; // not supported or implemented
	}

	object.prototype.lastStartTime = 0;
	object.prototype.startTime = 0;

	object.prototype.type = type;

	object.prototype.getType = function() {
		return this.type;
	}

	players[ type ] = object;

};

/*
	If someone is reading this and trying to figure out how
	I implemented each player API, here's what I did.

	To avoid endlessly searching for API documentations, I
	discovered that by decompiling a swf file, you can simply
	search for "ExternalInterface.addCallback" for finding
	JavaScript binded functions. And by reading the actual 
	source code, things should be much easier.

	This website provides a quick-and-easy way to decompile
	swf code http://www.showmycode.com/

	If you need additional information, you can reach me through
	the following contacts:

	samuelmaddock.com
	samuel.maddock@gmail.com
	http://steamcommunity.com/id/samm5506


	Test Cases

	theater.loadVideo( "youtube", "JVxe5NIABsI", 30 )
	theater.loadVideo( "vimeo", "55874553", 30 )
	theater.loadVideo( "twitch", "mega64podcast,a349531893", 30*60 )
	theater.loadVideo( "twitch", "cosmowright,c1789194" )
	theater.loadVideo( "twitchstream", "ignproleague" )
	theater.loadVideo( "blip", "6484826", 60 )

*/

var YouTubeVideo = function() {

	/*
		Embed Player Object
	*/
	var params = {
		allowScriptAccess: "always",
		bgcolor: "#000000",
		wmode: "opaque"
	};

	var attributes = {
		id: "player",
	};

	var url = "http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid=player&version=3";
	if ( theater.isCCEnabled() ) {
		url += "&cc_load_policy=1";
		url += "&yt:cc=on";
	}

	swfobject.embedSWF( url, "player", "100%", "100%", "9", null, null, params, attributes );

	/*
		Standard Player Methods
	*/
	this.setVideo = function( id ) {
		this.lastStartTime = null;
		this.lastVideoId = null;
		this.videoId = id;
	}

	this.setVolume = function( volume ) {
		this.lastVolume = null;
		this.volume = volume;
	}

	this.setStartTime = function( seconds ) {
		this.lastStartTime = null;
		this.startTime = seconds;
	}

	this.seek = function( seconds ) {
		if ( this.player != null ) {
			this.player.seekTo( seconds, true );

			// Video isn't playing
			if ( this.player.getPlayerState() != 1 ) {
				this.player.playVideo();
			}
		}
	}

	this.onRemove = function() {
		clearInterval( this.interval );
	}

	/*
		Player Specific Methods
	*/
	this.getCurrentTime = function() {
		if ( this.player != null ) {
			return this.player.getCurrentTime();
		}
	}

	this.canChangeTime = function() {
		if ( this.player != null ) {
			//Is loaded and it is not buffering
			return this.player.getVideoBytesTotal() != -1 &&
			this.player.getPlayerState() != 3;
		}
	}

	this.think = function() {

		if ( this.player != null ) {

			if ( this.videoId != this.lastVideoId ) {
				this.player.loadVideoById( this.videoId, this.startTime );
				this.lastVideoId = this.videoId;
				this.lastStartTime = this.startTime;
			}

			if ( this.player.getPlayerState() != -1 ) {

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.player.getVolume() ) {
					this.player.setVolume( this.volume );
					this.volume = this.player.getVolume();
				}

			}
		}

	}

	this.onReady = function() {
		this.player = document.getElementById('player');

		if ( theater.isHDEnabled() ) {
			this.player.setPlaybackQuality("hd720");
		}

		var self = this;
		this.interval = setInterval( function() { self.think(self); }, 100 );
	}

};
registerPlayer( VIDEO_YOUTUBE, YouTubeVideo );
registerPlayer( "youtube", YouTubeVideo );

function onYouTubePlayerReady( playerId ) {
	var player = theater.getPlayer();
	if ( player && ((player.getType() == VIDEO_YOUTUBE) || (player.getType() == "youtube")) ) {
		player.onReady();
	}
}

var VimeoVideo = function() {

	var self = this;

	this.froogaloop = null;

	/*
		Standard Player Methods
	*/
	this.setVideo = function( id ) {
		this.videoId = id;

		var elem = document.getElementById("player1");
		if (elem) {
			$f(elem).removeEvent('ready');
			this.froogaloop = null;
			elem.parentNode.removeChild(elem);
		}

		var url = "http://player.vimeo.com/video/" + id + "?api=1&player_id=player1";

		var frame = document.createElement('iframe');
		frame.setAttribute('id', 'player1');
		frame.setAttribute('src', url);
		frame.setAttribute('width', '100%');
		frame.setAttribute('height', '100%');
		frame.setAttribute('frameborder', '0');

		document.getElementById('player').appendChild(frame);

		$f(frame).addEvent('ready', this.onReady);
	}

	this.setVolume = function( volume ) {
		this.lastVolume = null;
		this.volume = volume / 100;
	}

	this.setStartTime = function( seconds ) {
		this.lastStartTime = null;
		this.startTime = seconds;
	}

	this.seek = function( seconds ) {
		if ( this.froogaloop != null ) {
			this.froogaloop.api('seekTo', seconds);
		}
	}

	this.onRemove = function() {
		this.froogaloop = null;
		clearInterval( this.interval );
	}

	/*
		Player Specific Methods
	*/
	this.think = function() {

		if ( this.froogaloop != null ) {

			if ( this.volume != this.lastVolume ) {
				this.froogaloop.api('setVolume', this.volume);
				this.lastVolume = this.volume;
			}

			if ( this.startTime != this.lastStartTime ) {
				this.seek( this.startTime );
				this.lastStartTime = this.startTime;
			}

			this.froogaloop.api('getVolume', function(v) {
				self.volume = parseFloat(v);
			});

			this.froogaloop.api('getCurrentTime', function(v) {
				self.currentTime = parseFloat(v);
			});

		}

	}

	this.onReady = function( player_id ) {
		self.lastStartTime = null;
		self.froogaloop = $f(player_id);
		self.froogaloop.api('play');
		self.interval = setInterval( function() { self.think(self); }, 100 );
	}

};
registerPlayer( VIDEO_VIMEO, VimeoVideo );
registerPlayer( "vimeo", VimeoVideo );

var TwitchVideo = function() {

	var self = this;

	this.videoInfo = {};

	/*
		Embed Player Object
	*/
	this.embed = function() {

		if ( !this.videoInfo.channel ) return;
		if ( !this.videoInfo.archive_id ) return;

		var flashvars = {
			hostname: "www.twitch.tv",
			channel: this.videoInfo.channel,
			auto_play: true,
			// custom: true,
			// enable_javascript: true,
			// watermark_position: "top_left",
			// consumer_key: "KOvCqpSlA0oTjSeSJJmAg",
			start_volume: (this.videoInfo.volume || 25), // this isn't working :(
			initial_time: (this.videoInfo.initial_time || 0)
		}

		var id = this.videoInfo.archive_id.slice(1);
		var videoType = this.videoInfo.archive_id.substr(0,1);
		if (videoType == "c") {
			flashvars.chapter_id = id;
		} else {
			flashvars.archive_id = id;
		}

		var swfurl = "http://www.twitch.tv/widgets/archive_site_player.swf";
		swfurl += "?channel=" + flashvars.channel;

		var params = {
			"allowFullScreen": "true",
			"allowNetworking": "all",
			"allowScriptAccess": "always",
			"movie": swfurl,
			"wmode": "opaque",
			"bgcolor": "#000000"
		};

		swfobject.embedSWF(
			swfurl,
			"player",
			"100%",
			"104%",
			"9.0.0",
			false,
			flashvars,
			params
		);

	}

	/*
		Standard Player Methods
	*/
	this.setVideo = function( id ) {
		this.lastVideoId = null;
		this.videoId = id;

		var info = id.split(',');

		this.videoInfo.channel = info[0];
		this.videoInfo.archive_id = info[1];

		// Wait for player to be ready
		if ( this.player == null ) {
			this.lastVideoId = this.videoId;
			this.embed();

			var i = 0;
			var interval = setInterval( function() {
				var el = document.getElementById("player");
				if(el.play_video){
					clearInterval(interval);
					self.onReady();
				}

				i++;
				if (i > 100) {
					console.log("Error waiting for player to load");
					clearInterval(interval);
				}
			}, 33);		
		}
	}

	this.setVolume = function( volume ) {
		this.lastVolume = null;
		this.volume = volume;
		this.videoInfo.volume = volume;
	}

	this.setStartTime = function( seconds ) {
		this.lastStartTime = null;
		this.startTime = seconds;
		this.videoInfo.initial_time = seconds;
	}

	this.seek = function( seconds ) {
		this.setStartTime( seconds )
	}

	this.onRemove = function() {
		clearInterval( this.interval );
	}

	/*
		Player Specific Methods
	*/
	this.think = function() {

		if ( this.player ) {
			
			if ( this.videoId != this.lastVideoId ) {
				this.embed();
				this.lastVideoId = this.videoId;
			}

			if ( this.startTime != this.lastStartTime ) {
				this.embed();
				this.lastStartTime = this.startTime;
			}

			if ( this.volume != this.lastVolume ) {
				// this.embed(); // volume doesn't change...
				this.lastVolume = this.volume;
			}

		}

	}

	this.onReady = function() {
		this.player = document.getElementById('player');
		this.interval = setInterval( function() { self.think(self); }, 100 );
	}

};
registerPlayer( VIDEO_TWITCH, TwitchVideo );
registerPlayer( "twitch", TwitchVideo );

var TwitchStreamVideo = function() {

	var self = this;

	/*
		Embed Player Object
	*/
	this.embed = function() {

		var flashvars = {
			hostname: "www.twitch.tv",
			channel: this.videoId,
			auto_play: true,
			start_volume: (this.volume || 25) // this isn't working :(
		}

		var swfurl = "http://www.twitch.tv/widgets/live_embed_player.swf";

		var params = {
			"allowFullScreen": "true",
			"allowNetworking": "all",
			"allowScriptAccess": "always",
			"movie": swfurl,
			"wmode": "opaque",
			"bgcolor": "#000000"
		};

		swfobject.embedSWF(
			swfurl,
			"player",
			"100%",
			"104%",
			"9.0.0",
			false,
			flashvars,
			params
		);

	}

	/*
		Standard Player Methods
	*/
	this.setVideo = function( id ) {
		this.lastVideoId = null;
		this.videoId = id;

		// Wait for player to be ready
		if ( this.player == null ) {
			this.lastVideoId = this.videoId;
			this.embed();

			var i = 0;
			var interval = setInterval( function() {
				var el = document.getElementById("player");
				if(el.mute){
					clearInterval(interval);
					self.onReady();
				}

				i++;
				if (i > 100) {
					console.log("Error waiting for player to load");
					clearInterval(interval);
				}
			}, 33);		
		}
	}

	this.setVolume = function( volume ) {}

	this.setStartTime = function( seconds ) { }

	this.seek = function( seconds ) { }

	this.onRemove = function() {
		clearInterval( this.interval );
	}

	/*
		Player Specific Methods
	*/
	this.think = function() {

		if ( this.player ) {
			
			if ( this.videoId != this.lastVideoId ) {
				this.embed();
				this.lastVideoId = this.videoId;
			}

		}

	}

	this.onReady = function() {
		this.player = document.getElementById('player');
		this.interval = setInterval( function() { self.think(self); }, 100 );
	}

};
registerPlayer( VIDEO_TWITCH_STREAM, TwitchStreamVideo );
registerPlayer( "twitchstream", TwitchStreamVideo );

var BlipVideo = function() {

	var self = this;

	this.lastState = null;
	this.state = null;

	/*
		Embed Player Object
	*/
	var flashvars = {
		autostart: true,
		noads: true,
		showinfo: false,
		onsite: true,
		nopostroll: true,
		noendcap: true,
		showsharebutton: false,
		removebrandlink: true,
		skin: "BlipClassic",
		backcolor: "0x000000",
		floatcontrols: true,
		fixedcontrols: true,
		largeplaybutton: false,
		controlsalpha: ".0",
		autohideidle: 1000,
		file: "http://blip.tv/rss/flash/123123123123", // bogus url
	}

	var params = {
		"allowFullScreen":"true",
		"allowNetworking":"all",
		"allowScriptAccess":"always",
		"wmode":"opaque",
		"bgcolor":"#000000"
	};

	swfobject.embedSWF(
		// "http://a.blip.tv/scripts/flash/stratos.swf",
		"http://blip.tv/scripts/flash/stratos.swf",
		"player",
		"100%",
		"100%",
		"9.0.0",
		false,
		flashvars,
		params
	);

	/*
		play\n") + "pause\n") + "stop\n") + "next\n") + "previous\n") + "volume\n") + "mute\n") + "seek\n") + "scrub\n") + "fullscreen\n") + "playpause\n") + "toggle_hd\n") + "auto_hide_components\n") + "auto_show_components\n") + "show_endcap"));

		ExternalInterface.addCallback("getAvailableEvents", this.getAvailableStateChanges);
		ExternalInterface.addCallback("sendEvent", this.handleJsStateChangeEvent);
		ExternalInterface.addCallback("setPlayerUpdateTime", this.setUpdateInterval);
		ExternalInterface.addCallback("getAllowedEvents", this.displayAllowedEvents);
		ExternalInterface.addCallback("addJScallback", this.addExternallySpecifiedCallback);
		ExternalInterface.addCallback("getPlaylist", this.sendOutJSONplaylist);
		ExternalInterface.addCallback("getDuration", this.getDuration);
		ExternalInterface.addCallback("getPNG", this.getPNG);
		ExternalInterface.addCallback("getJPEG", this.getJPEG);
		ExternalInterface.addCallback("getCurrentState", this.getCurrentState);
		ExternalInterface.addCallback("getHDAvailable", this.getHDAvailable);
		ExternalInterface.addCallback("getCCAvailable", this.getCCAvailable);
		ExternalInterface.addCallback("getPlayerVersion", this.getPlayerVersion);
		ExternalInterface.addCallback("getEmbedParamValue", this.sendOutEmbedParamValue);
	*/

	/*
		Standard Player Methods
	*/
	this.setVideo = function( id ) {
		this.lastVideoId = null;
		this.videoId = id;

		// Wait for player to be ready
		if ( this.player == null ) {
			var i = 0;
			var interval = setInterval( function() {
				var el = document.getElementById("player");
				if(el.addJScallback){
					clearInterval(interval);
					self.onReady();
				}

				i++;
				if (i > 100) {
					console.log("Error waiting for player to load");
					clearInterval(interval);
				}
			}, 33);		
		} else {
			this.player.sendEvent( 'pause' );
		}

	}

	this.setVolume = function( volume ) {
		this.lastVolume = null;
		this.volume = volume / 100;
	}

	this.setStartTime = function( seconds ) {
		this.lastStartTime = null;
		this.startTime = seconds;
	}

	this.seek = function( seconds ) {
		if ( this.player != null ) {
			this.player.sendEvent( 'seek', seconds );
		}
	}

	this.onRemove = function() {
		clearInterval( this.interval );
	}

	/*
		Player Specific Methods
	*/

	this.think = function() {

		if ( (this.player != null) ) {

			if ( this.videoId != this.lastVideoId ) {
				this.player.sendEvent( 'newFeed', "http://blip.tv/rss/flash/" + this.videoId );
				this.lastVideoId = this.videoId;
				this.lastVolume = null;
				this.lastStartTime = null;
			}

			if ( this.player.getCurrentState() == "playing" ) {

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					this.player.sendEvent( 'volume', this.volume );
					this.lastVolume = this.volume;
				}

			}
		}

	}

	this.onReady = function() {
		this.player = document.getElementById('player');
		this.interval = setInterval( function() { self.think(self); }, 100 );
	}

};
registerPlayer( VIDEO_BLIP, BlipVideo );
registerPlayer( "blip", BlipVideo );

var UrlVideo = function() {

	var self = this;

	/*
		Embed Player Object
	*/
	this.embed = function() {

		var elem = document.getElementById("player1");
		if (elem) {
			elem.parentNode.removeChild(elem);
		}

		var frame = document.createElement('iframe');
		frame.setAttribute('id', 'player1');
		frame.setAttribute('src', this.videoId);
		frame.setAttribute('width', '100%');
		frame.setAttribute('height', '100%');
		frame.setAttribute('frameborder', '0');

		document.getElementById('player').appendChild(frame);

	}

	/*
		Standard Player Methods
	*/
	this.setVideo = function( id ) {
		this.lastVideoId = null;
		this.videoId = id;

		// Wait for player to be ready
		if ( this.player == null ) {
			this.lastVideoId = this.videoId;
			this.embed();

			var i = 0;
			var interval = setInterval( function() {
				var el = document.getElementById("player");
				if(el){
					clearInterval(interval);
					self.onReady();
				}

				i++;
				if (i > 100) {
					console.log("Error waiting for player to load");
					clearInterval(interval);
				}
			}, 33);		
		}
	}

	this.setVolume = function( volume ) {}

	this.setStartTime = function( seconds ) { }

	this.seek = function( seconds ) { }

	this.onRemove = function() {
		clearInterval( this.interval );
	}

	/*
		Player Specific Methods
	*/
	this.think = function() {

		if ( this.player ) {
			
			if ( this.videoId != this.lastVideoId ) {
				this.embed();
				this.lastVideoId = this.videoId;
			}

		}

	}

	this.onReady = function() {
		this.player = document.getElementById('player');
		this.interval = setInterval( function() { self.think(self); }, 100 );
	}

};
registerPlayer( VIDEO_URL, UrlVideo );
registerPlayer( "url", UrlVideo );