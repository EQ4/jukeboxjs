var Jukebox = function() {
  if (window.jukeboxAudioContext) {
    audioContext = jukeboxAudioContext;
  } else {
	 var audioContext = webkitAudioContext ? new webkitAudioContext() : null; 
   window.jukeboxAudioContext = audioContext;
  }
  var timer = new jukeboxTimer();
  var filter = new webAudioFilterPack(this.audioContext);

  var Oscillator = function(options) {
        var context = audioContext,
        oscillator = this,
        _target,
        _oscillatorRunning = false,
        frequency = options.frequency || 440,
        type = options.type || "SINE";

        var _oscillator = context.createOscillator();
        var gain = audioContext.createGain();
        gain.connect(audioContext.destination);


        var play = function() {
          if (_oscillatorRunning) return;

          _oscillator = context.createOscillator(); // Create sound source

          if (_target) {
           _oscillator.connect(_target); // Connect sound to output
           _target.connect(gain); // Connect sound to output
          } else {
           _oscillator.connect(gain); // Connect sound to output 
          }

          _oscillator.frequency.value = frequency;
          _oscillator.type = type;
          _oscillator.noteOn(1);
          _oscillatorRunning = true;
        }

        var stop = function() {
          if (!_oscillatorRunning) return;
          _oscillator.noteOff(1);
          _oscillatorRunning = false;
        }

        var setFrequency = function(_frequency){
          frequency = _frequency;
          _oscillator.frequency.value = _frequency;
        }

        var setType = function(_wave) {
          type = wave;
          _oscillator.type = _oscillator[wave];
        }

        this.connect = function(node) {
          _target = node;
        }

        return {
          play:play,
          stop:stop,
          setFrequency:setFrequency,
          gain:gain
        }
    };

	var Synthesizer = function(options) {
    options = options || {};
    var oscillators,
    currentSequence;

    if (options.oscillators) {
      oscillators = options.oscillators.map(function(schema){
        return new Oscillator(schema);
      });
    } else {
      oscillators = [new Oscillator({wave:"SINE"}),new Oscillator({wave:"SQUARE"})];
    }

		var sequence = function(notes) {
      endSequence();
      currentSequence = timer.setSequence(notes.map(function(note){
        return {
          timeout: note.duration,
          callback: function() {
            synth.tone(note.frequency,note.duration-10);  
          }
        }
      }))
		};

    var setVolume = function(volume) {
      oscillators.forEach(function(oscillator){
        oscillator.gain.value = volume;
      })
    }

    var endSequence = function() {
      if (currentSequence) {
        timer.clearSequence(currentSequence);
      }
    }

		var tone = function(freq,duration) {
			oscillators.forEach(function(osc){
				osc.setFrequency(freq);
				if (freq < 0) {
					return;
				}
				osc.play();
				timer.setTimeout(function(){
					osc.stop();
				},duration);
			})
		};

    return {
      setVolume:setVolume,
      tone:tone,
      sequence:sequence,
    }
	};

  var Patterns = {

  }

  

  return {
    getSynth:function(options){
      return new Synthesizer(options);
    },
    getModulator:function(options){
      return new Oscillator(options);
    },
    getContext:function(){
      return audioContext;
    }
  }
}
