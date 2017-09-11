"use strict";
// Implements the logic of the Kuramoto model

// Different possible distribution functions
// A distribution has a sample(n) function to retrieve n samples

// Gauss distribution
function GaussDistribution(mean, stdev) {
    this.mean = mean;
    this.stdev = stdev
    this.sample = function(n) {
	var r = new Float64Array(n);
	for (var i=0; i<n; ++i) {
	    r[i] = rnorm(this.mean, this.stdev);
	}
	return r;
    };
    this.penroseCurve = function() {
	var s = 1 / this.stdev;
	return stdGaussPenroseData.map(function (x) {
	    return [s * x[0], s*x[1]]
	});
    }
}

// Bi-Cauchy distribution
function BiCauchyDistribution(relSize1, mean1, scale1, mean2, scale2) {
    this.relSize1 = relSize1;
    this.mean1 = mean1;
    this.scale1 = scale1;
    this.mean2 = mean2;
    this.scale2 = scale2;
    this.sample = function (n) {
	var r = new Float64Array(n);
	for (var i=0; i<n; ++i) {
	    // Decide which population to sample and the use their parameter
	    if (Math.random() <= relSize1) {
		r[i] = rcauchy(this.mean1, this.scale1);
	    } else {
		r[i] = rcauchy(this.mean2, this.scale2);
	    }
	}
	return r;
    };
    this.penroseCurve = function() {
	function i(mean, scale, x) {
	    var c = scale*scale + (x-mean)*(x-mean);
	    return [scale/c, (mean-x)/c];
	}
	var r = [];
	for (var x=-100; x<100; x += 0.05) {
	    var i1 = i(this.mean1, this.scale1, x);
	    var i2 = i(this.mean2, this.scale2, x);
	    r.push([this.relSize1 * i1[0] + (1-this.relSize1) * i2[0],
		    this.relSize1 * i1[1] + (1-this.relSize1) * i2[1]]);
	}
	return r;
    }
}

// Simulation object
function KuramotoSim(systemSize, distribution) {
    // Adds a callback to update subsequent graphs
    this.updateListener = function () {};
    // Setup the simulation variables (and reset if change)
    var n = systemSize;
    var fDistribution = distribution;
    Object.defineProperty(this, 'n', {
	get: function() {
	    return n;
	},
	set: function(value) {
	    n = value;
	    this.reset()
	}
    });
    Object.defineProperty(this, 'distribution', {
	get: function() {
	    return fDistribution;
	},
	set: function(value) {
	    fDistribution = value;
	    this.reset()
	}
    });
    this.reOrderParameter = function () {
	return this.angles.reduce(function (prev, th) {
	    return prev + Math.cos(th);
	}, 0) / n;
    };
    this.imOrderParameter = function () {
	return this.angles.reduce(function (prev, th) {
	    return prev + Math.sin(th);
	}, 0) / n;
    };
    this.reOrderParameterShifted = function () {
	var shift = this.phaseShift;
	return this.angles.reduce(function (prev, th) {
	    return prev + Math.cos(th - shift);
	}, 0) / n;
    };
    this.imOrderParameterShifted = function () {
	var shift = this.phaseShift;
	return this.angles.reduce(function (prev, th) {
	    return prev + Math.sin(th - shift);
	}, 0) / n;
    };
    this.pushHistory = function () {
	this.historyTime.push(this.time);
	this.historyReOrder.push(this.reOrderParameter());
	this.historyImOrder.push(this.imOrderParameter());
    };
    this.reset = function () {
	this.frequencies = this.distribution.sample(this.n);
	this.angles = new Float64Array(this.n);
	// If this.angles has no reduce (Shame on you Safari) just use
	// a normal array (also for frequencies in order to avoid
	// problems with for ... of loops
	if (! ("reduce" in this.angles)) {
	    this.angles = Array.from(this.angles);
	    this.frequencies = Array.from(this.frequencies);
	}
	for (var i=0; i<this.n; ++i) {
	    this.angles[i] = 2 * Math.PI * Math.random();
	}
	this.time = 0;
	this.historyTime = [];
	this.historyReOrder = [];
	this.historyImOrder = [];
	this.pushHistory();
	this.updateListener();
    };
    // Add parameters for running the simulation
    this.couplingK = 1.0;
    this.phaseShift = 0.0;
    this.addNoise = false;
    this.noiseStrength = 1;
    this.maxTimeStep = 0.01; // Maximal time step in Euler
    // Reset for the first value
    this.reset();
    // Runs the model for a given time and adds point in the history
    this.run = function (time) {
	var stepNumber = Math.ceil(time / this.maxTimeStep);
	var stepSize = time / stepNumber;
	var stepSizeSqrt = Math.sqrt(stepSize);
	// Use a simple forward Euler scheme *hope* that it is okay
	for (var i=0; i < stepNumber; ++i) {
	    var reOrder = this.reOrderParameterShifted();
	    var imOrder = this.imOrderParameterShifted();
	    for (var j=0; j < this.angles.length; ++j) {
		this.angles[j] += stepSize * (this.frequencies[j]
					      - this.couplingK * reOrder * Math.sin(this.angles[j])
					      + this.couplingK * imOrder * Math.cos(this.angles[j]));
		if (this.addNoise) {
		    this.angles[j] += this.noiseStrength * rnorm(0, stepSizeSqrt);
		}
	    }
	}
	this.time += time;
	this.pushHistory();
	this.updateListener()
    }
    // Adds a perturbation to the current state
    this.addPerturbation = function (angle, strength) {
	for (var i=0; i<this.angles.length; ++i) {
	    this.angles[i] += strength * Math.sin(angle - this.angles[i]);
	}
	this.updateListener();
    };
}
