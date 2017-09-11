"use strict";

// Function to sync a slider with a value
// Assumes the range given by the slider is valid and uses the step of
// the slider to decide if it allows floating point (step=1 integer,
// otherwise floating point)
function linkSliderNumber(sliderName, numberName, updateCallback) {
    var inputNumber = $("input[name=" + numberName + "]");
    var inputSlider = $("input[name=" + sliderName + "]");
    var isInt = inputSlider.prop("step") == 1;
    inputNumber.change(function() {
	var numberV, numberMin, numberMax;
	if (isInt) {
	    numberV = parseInt(inputNumber.val());
	    numberMin = parseInt(inputSlider.prop("min"));
	    numberMax = parseInt(inputSlider.prop("max"));
	} else {
	    numberV = parseFloat(inputNumber.val());
	    numberMin = parseFloat(inputSlider.prop("min"));
	    numberMax = parseFloat(inputSlider.prop("max"));
	}
	if (isNaN(numberV) || numberV > numberMax || numberV < numberMin) {
	    // Invalid number, replace with the current value (known from the slider)
	    inputNumber.val(inputSlider.val());
	} else {
	    // Update to the parsed value
	    inputNumber.val(numberV);
	    // Update the slide
	    inputSlider.val(numberV);
	    updateCallback()
	}
    });
    inputSlider.change(function() {
	inputNumber.val(inputSlider.val());
	updateCallback();
    });
}

// Adds all the logic for the user control panel
// If a value is changed with results in a different setup, then
// updateConfigurationCallback is called
// If a value is changed how to run the configuration with the current
// setup, then updatePlayingCallback is called
function addControlLogic(updateConfigurationCallback, updatePlayingCallback) {
    // Setup the links for the control panel
    linkSliderNumber("system-size-slider", "system-size-number", updateConfigurationCallback);
    linkSliderNumber("coupling-k-slider", "coupling-k-number", updatePlayingCallback);
    linkSliderNumber("phase-shift-slider", "phase-shift-number", updatePlayingCallback);
    linkSliderNumber("noise-strength-slider", "noise-strength-number", updatePlayingCallback);
    linkSliderNumber("gauss-mean-slider", "gauss-mean-number", updateConfigurationCallback);
    linkSliderNumber("gauss-stdev-slider", "gauss-stdev-number", updateConfigurationCallback);
    linkSliderNumber("bi-cauchy-rel-size-1-slider", "bi-cauchy-rel-size-1-number", updateConfigurationCallback);
    linkSliderNumber("bi-cauchy-mean-1-slider", "bi-cauchy-mean-1-number", updateConfigurationCallback);
    linkSliderNumber("bi-cauchy-scale-1-slider", "bi-cauchy-scale-1-number", updateConfigurationCallback);
    linkSliderNumber("bi-cauchy-mean-2-slider", "bi-cauchy-mean-2-number", updateConfigurationCallback);
    linkSliderNumber("bi-cauchy-scale-2-slider", "bi-cauchy-scale-2-number", updateConfigurationCallback);
    linkSliderNumber("perturbation-angle-slider", "perturbation-angle-number", function() {});
    linkSliderNumber("perturbation-strength-slider", "perturbation-strength-number", function() {});
    linkSliderNumber("max-step-size-slider", "max-step-size-number", updatePlayingCallback);
    linkSliderNumber("update-interval-slider", "update-interval-number", function() {});

    // Listen to the chosen distribution
    var distributionSelect = $("select[name=frequency-distribution]");
    // Set the initial value correctly
    if (distributionSelect.val() == "gauss") {
	$("#distribution-parameter-gauss").removeClass("hidden");
	$("#distribution-parameter-bi-cauchy").addClass("hidden");
    } else if (distributionSelect.val() == "bi-cauchy") {
	$("#distribution-parameter-gauss").addClass("hidden");
	$("#distribution-parameter-bi-cauchy").removeClass("hidden");
    }
    // Add handler
    distributionSelect.change(function() {
	if (distributionSelect.val() == "gauss") {
	    $("#distribution-parameter-gauss").removeClass("hidden");
	    $("#distribution-parameter-bi-cauchy").addClass("hidden");
	} else if (distributionSelect.val() == "bi-cauchy") {
	    $("#distribution-parameter-gauss").addClass("hidden");
	    $("#distribution-parameter-bi-cauchy").removeClass("hidden");
	}
	updateConfigurationCallback();
    });

    // Allow the noise button
    var noiseBox = $("input[name=add-noise]");
    noiseBox.change(function () {
	var noiseBoxValue = noiseBox.prop("checked");
	$("input[name=noise-strength-number]").prop("disabled", !noiseBoxValue);
	$("input[name=noise-strength-slider]").prop("disabled", !noiseBoxValue);
	updatePlayingCallback();
    });

    // Listen to speed changes
    var speedSlider = $("input[name=simulation-speed]");
    // Set the speed from reloading and update after slider movement
    $("#simulation-speed-value-output").text(speedSlider.val());
    speedSlider.change(function () {
	$("#simulation-speed-value-output").text(speedSlider.val());
    });
}

// Function to read parameter from the UI
function getConfigurationUI () {
    var conf = {};
    conf['systemSize'] = parseInt($("input[name=system-size-slider]").val());
    conf['distributionName'] = $("select[name=frequency-distribution]").val()
    if (conf.distributionName == "gauss") {
	conf['mean'] = parseFloat($("input[name=gauss-mean-slider]").val());
	conf['stdev'] = parseFloat($("input[name=gauss-stdev-slider]").val());
	conf['distribution'] = new GaussDistribution(conf.mean, conf.stdev);
    } else if (conf.distributionName == "bi-cauchy") {
	conf['relSize1'] = parseFloat($("input[name=bi-cauchy-rel-size-1-slider]").val());
	conf['mean1'] = parseFloat($("input[name=bi-cauchy-mean-1-slider]").val());
	conf['scale1'] = parseFloat($("input[name=bi-cauchy-scale-1-slider]").val());
	conf['mean2'] = parseFloat($("input[name=bi-cauchy-mean-2-slider]").val());
	conf['scale2'] = parseFloat($("input[name=bi-cauchy-scale-2-slider]").val());
	conf['distribution'] = new BiCauchyDistribution(
	    conf.relSize1, conf.mean1, conf.scale1, conf.mean2, conf.scale2);
    }
    return conf;
}

function getRunningUI() {
    var conf = {};
    conf['couplingK'] = parseFloat($("input[name=coupling-k-slider]").val());
    conf['phaseShift'] = parseFloat($("input[name=phase-shift-slider]").val());
    conf['addNoise'] = $("input[name=add-noise]").prop("checked");
    conf['noiseStdev'] = parseFloat($("input[name=noise-strength-slider]").val());
    conf['maxStepSize'] = parseFloat($("input[name=max-step-size]").val());
    return conf;
}

function getPerturbationUI() {
    var conf = {};
    conf['angle'] = parseFloat($("input[name=perturbation-angle-slider]").val());
    conf['strength'] = parseFloat($("input[name=perturbation-strength-slider]").val());
    return conf;
}

function getUpdateUI() {
    var conf = {}
    conf['speed'] = parseFloat($("input[name=simulation-speed]").val());
    conf['updateInterval'] = parseFloat($("input[name=update-interval-slider]").val());
    return conf;
}

// Plot the Penrose diagram
function plotPenrose() {
    var confC = getConfigurationUI();
    var confR = getRunningUI();
    var contourD = confC.distribution.penroseCurve();
    $.plot("#penrose-placeholder",
	   [
	       {
		   data : contourD,
		   lines : {show : true},
	       },
	       {
		   data : [[2 * Math.cos(confR.phaseShift)/ confR.couplingK,
			    2 * Math.sin(confR.phaseShift)/ confR.couplingK]],
		   points : {show : true},
		   color : "#ff0000",
		   label : "2e<sup>i&alpha;</sup>/K"
	       },
	   ] ,
	   {
	       axisLabels : {show:true},
	       xaxes : [{axisLabel:"Re"}],
	       yaxes : [{axisLabel:"Im"}]
	   });
}

$(function() {
    // Creates a simulation object and link it to the UI
    var confSetup = getConfigurationUI();
    var sim = new KuramotoSim(confSetup.systemSize, confSetup.distribution);
    function updateC() {
	var conf = getConfigurationUI();
	sim.n = conf.systemSize;
	sim.distribution = conf.distribution;
	plotPenrose()
    }
    function updateR() {
	var conf = getRunningUI();
	sim.couplingK = conf.couplingK;
	sim.phaseShift = conf.phaseShift;
	sim.addNoise = conf.addNoise;
	sim.noiseStrength = conf.noiseStdev;
	sim.maxStepSize = conf.maxStepSize;
	plotPenrose();
    }
    updateR();
    addControlLogic(updateC, updateR);

    // Link the control buttons
    var startPauseButton = $("#sim-start-pause");
    var playbackF = function () {
	var conf = getUpdateUI();
	sim.run(conf.updateInterval * conf.speed * 0.001);
    }
    var playbackID = null;
    startPauseButton.click(function () {
	var startPauseValue = startPauseButton.text() == "Pause";
	if (startPauseValue) {
	    startPauseButton.text("Start");
	} else {
	    startPauseButton.text("Pause");
	}
	// Resets the playback timer
	if (playbackID !== null) {
	    window.clearInterval(playbackID);
	    playbackID = null;
	}
	// Add playback if needed
	if (!startPauseValue) {
	    var conf = getUpdateUI();
	    playbackID = window.setInterval(playbackF, conf.updateInterval);
	}
    });
    $("#sim-reset").click(function() {
	sim.reset();
    });
    $("#add-perturbation").click(function() {
	var conf = getPerturbationUI();
	sim.addPerturbation(conf.angle, conf.strength);
    });

    // Link the graphics to the updates of the simulation object
    sim.updateListener = function () {
	// Output time
	$("#simulation-time-output").text(sim.time.toFixed(2));
	// Plot the big circle
	// Data for the background circle
	var dCircleBackground = [];
	var backgroundN = 50;
	for (var i=0; i<=backgroundN; ++i) {
	    var theta = 2 * Math.PI * i / backgroundN;
	    dCircleBackground.push([Math.cos(theta), Math.sin(theta)]);
	}
	var dCircle = [];
	for (var theta of sim.angles) {
	    dCircle.push([Math.cos(theta), Math.sin(theta)]);
	}
	$.plot("#sim-circle-placeholder",
	       [
		   {
		       data : dCircleBackground,
		       lines : {show : true}
		   }, {
		       data : dCircle,
		       points : {show : true}
		   }, {
		       // Mean value
		       data : [[sim.reOrderParameter(), sim.imOrderParameter()]],
		       points : {show : true}
		   }] ,
	       {
		   xaxis : {min:-1.1, max:1.1},
		   yaxis : {min:-1.1, max:1.1},
	       });
	// Plot the histograms
	var phaseBinNumber = 10;
	var tPi = 2 * Math.PI;
	var dPhaseHisto = [];
	for (var i=0; i<phaseBinNumber; ++i) {
	    dPhaseHisto.push([tPi*i/phaseBinNumber, 0]);
	}
	for (var theta of sim.angles) {
	    var binN = Math.floor(phaseBinNumber * ((theta%tPi + tPi) % tPi) / tPi);
	    dPhaseHisto[binN][1] += 1;
	}
	$.plot("#sim-phase-placeholder",
	       [
		   {
		       data : dPhaseHisto,
		       bars : {show : true,
			       barWidth : tPi / phaseBinNumber,
			       align : "left"
			      }
		   }
	       ] ,
	       {
		   xaxis : {min:0, max:2*Math.PI},
		   yaxis : {min:0},
		   axisLabels : {show:true},
		   xaxes : [{axisLabel:"Phase angles"}]
	       });
	var freqHistNumber = 11;
	var freqHistMin = -10;
	var freqHistMax = 10;
	var freqHistLength = freqHistMax-freqHistMin;
	var freqHistDist = freqHistLength / (freqHistNumber-1);
	var dFreqHisto = [];
	for (var i=0; i<freqHistNumber; ++i) {
	    dFreqHisto.push([freqHistMin + i * freqHistDist, 0]);
	}
	for (var f of sim.frequencies) {
	    var binN;
	    if (f < freqHistMin) {
		binN = 0;
	    } else if (f > freqHistMax) {
		binN = freqHistNumber-1;
	    } else {
		var sf = (f - freqHistMin + 0.5*freqHistDist) / (freqHistLength+freqHistDist);
		binN = Math.floor(sf * freqHistNumber);
	    }
	    dFreqHisto[binN][1] += 1;
	}
	$.plot("#sim-freq-placeholder",
	       [
		   {
		       data : dFreqHisto,
		       bars : {show : true,
			       barWidth : freqHistDist,
			       align : "center"
			      }
		   }
	       ] ,
	       {
		   xaxis : {min:-10.5, max:10.5},
		   yaxis : {min:0},
		   axisLabels : {show:true},
		   xaxes : [{axisLabel:"Natural frequencies"}]
	       });
	var dOrderAbs = [];
	var dOrderRe = [];
	var dOrderIm = [];
	var n = sim.historyTime.length;
	for (var i=0; i<n; ++i) {
	    var t = sim.historyTime[i];
	    var re = sim.historyReOrder[i];
	    var im = sim.historyImOrder[i];
	    var abs = Math.sqrt(re*re + im*im);
	    dOrderAbs.push([t, abs]);
	    dOrderRe.push([t, re]);
	    dOrderIm.push([t, im]);
	}
	$.plot("#sim-order-placeholder",
	       [
		   {
		       data : dOrderAbs,
		       lines : {show : true},
		       label : "Absolute value"
		   },
		   {
		       data : dOrderRe,
		       lines : {show : true},
		       label : "Real part"
		   },
		   {
		       data : dOrderIm,
		       lines : {show : true},
		       label : "Imaginary part"
		   }
	       ] ,
	       {
		   yaxis : {min:-1, max:1},
		   xaxis : {min:0},
		   axisLabels : {show:true},
		   xaxes : [{axisLabel:"Time"}]
	       });
    }
    // Update for the first time on loading
    sim.updateListener();
})
