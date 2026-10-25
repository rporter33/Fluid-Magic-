#!/bin/sh
cd "$(dirname "$0")"; L=../out/logs
lane1() { node seedprobe.cjs s44 > $L/r2-s44.log 2>&1; node histdiag3.cjs 1 > $L/r2-hist.log 2>&1; VIEWS=min node checksx.cjs natural 2 > $L/r2-min2.log 2>&1; }
lane2() { node phonefit.cjs natural 3 > $L/r2-phonefit.log 2>&1; ONLYNOW=1 node modewild.cjs 1 > $L/r2-modewild.log 2>&1; VIEWS=far node checksx.cjs natural 1 > $L/r2-far1.log 2>&1; VIEWS=near-forest,near-swamp node checksx.cjs natural 3 390 844 > $L/r2-phone-near.log 2>&1; }
lane1 & lane2 & wait; echo done
