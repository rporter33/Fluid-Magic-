#!/bin/bash
shopt -s globstar;
shopt -s nocaseglob;

for i in ./**/*.png;
do
  pngquant "$i" -v --skip-if-larger -f --ext=.png;
done

