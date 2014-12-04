var Jukebox = function() {
    if (window.jukeboxAudioContext) {
        audioContext = jukeboxAudioContext;
    } else {
        var audioContext = webkitAudioContext ? new webkitAudioContext() : null;
        window.jukeboxAudioContext = audioContext;
    }
    var timer = new jukeboxTimer();
    var filter = new webAudioFilterPack(this.audioContext);


    var Modulator = function(options) {
        options = options || {};

        options.oscillators = options.oscillators || ["square",'triangle','sawtooth','sine'];
        options.effects = options.effects || [];
        options.frequency = options.frequency || 440;
        options.noteLength = options.noteLength || 300;

        var context = audioContext,
            targetAudioNode,
            oscillators = [],
            playing = false,
            gain,
            playingOscillators = [],
            frequency = options.frequency;

        function easeGainNodeOutLinear(node,timeout) {
          var startGain = node.gain.value;
          var endGain = 0;
          var steps = 50;
          var timePerStep = timeout / steps;
          var difference = startGain - endGain;

          for (var currentStep = 1; currentStep <= steps; currentStep++) {
            var volumeAtStep = startGain - difference / steps * currentStep;
            console.log("setting ramp step",currentStep,volumeAtStep);
            var timeAtStep = context.currentTime + timePerStep * currentStep / 10000;
            // node.gain.setValueAtTime(1 - currentStep / 100,context.currentTime + timePerStep * currentStep / 1000);
            node.gain.setValueAtTime(volumeAtStep,timeAtStep);
          }
          // var interval = timer.setInterval(function(){
          //   if (timeout < 0) {
          //     clearInterval(interval);
          //     return;
          //   }
          //   console.log("easing cain...",node.gain.value);
          //   timeout--;
          //   steps++;
          //   node.gain.setValueAtTime(startGain * (1 / (1 + steps * steps / 100)),context.currentTime)
          //   // node.gain.value = 0;
          //   // node.gain.value = 
          // },1)


        }     

        var play = function() {
            if (playing) {
              stop();
            }
            playing = true;

            options.oscillators.forEach(function(oscillatorDefinition) {
                var oscillator = context.createOscillator();
                oscillator.type = oscillatorDefinition;

                var gain = audioContext.createGain();
                gain.connect(audioContext.destination);

                if (playing) {
                    oscillator.frequency.value = frequency;
                } else {
                    oscillator.frequency.value = 0;
                }

                gain.gain.linearRampToValueAtTime(0, context.currentTime); 
                gain.gain.linearRampToValueAtTime(1, context.currentTime + 0.01);   

                oscillator.noteOn(0);
                oscillator.gain = gain;
                oscillator.connect(gain);
                playingOscillators.push(oscillator);
                
                return oscillator;
            });
        }

        var stop = function() {
            if (!playing) {
              return;
            }
            playing = false;
            var fadingOscillators = [];
            playingOscillators.forEach(function(oscillator){
              // oscillator.gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5); 
              easeGainNodeOutLinear(oscillator.gain, 100);
              // oscillator.gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5); 
            });
            while (playingOscillators[0]) {
              fadingOscillators.push(playingOscillators.pop());
            };

            timer.setTimeout(function(){
              fadingOscillators.forEach(function(oscillator){
                // console.log("Fading oscillators..",oscillator);
                oscillator.noteOff(0);
                fadingOscillators.splice(fadingOscillators.indexOf(oscillator),1);
             });
            },1000)
        }

        var setFrequency = function(_frequency) {
            frequency = _frequency;
             oscillators.forEach(function(oscillator) {
              oscillator.frequency.value = frequency;
            });
        }

        return {
            play: play,
            stop: stop,
            setFrequency: setFrequency,
        }
    };

    var Synthesizer = function(options) {
        options = options || {};
        options.schema = options.schema || JBSCHEMA.synthesizers['Omaha DS6'];

        var modulators = [],
            currentSequence;

        modulators = options.schema.modulators.map(function(schema) {
            return new Modulator({
                oscillators: schema.oscillators
            });
        });

        var sequence = function(notes) {
            endSequence();
            currentSequence = timer.setSequence(notes.map(function(note) {
                return {
                    timeout: note.duration,
                    callback: function() {
                        synth.tone(note.frequency, note.duration - 10);
                    }
                }
            }))
        };

        var setVolume = function(volume) {
            oscillators.forEach(function(oscillator) {
                // oscillator.gain.value = volume;
            })
        }

        var endSequence = function() {
            if (currentSequence) {
                timer.clearSequence(currentSequence);
            }
        }

        var tone = function(freq, duration) {
            modulators.forEach(function(modulator) {
                modulator.setFrequency(freq);
                if (freq < 0) {
                    return;
                }
                modulator.play();
                timer.setTimeout(function() {
                    modulator.stop();
                }, duration);
            })
        };

        return {
            setVolume: setVolume,
            tone: tone,
            sequence: sequence,
            endSequence: endSequence,
        }
    };

    var Patterns = {

    }



    return {
        getSynth: function(options) {
            return new Synthesizer(options);
        },
        getModulator: function(options) {
            return new Modulator(options);
        },
        getContext: function() {
            return audioContext;
        }
    }
}
