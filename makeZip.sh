#!/bin/sh
NAME=freon@UshakovVasilii_Github.yahoo.com
glib-compile-schemas $NAME/schemas
cd $NAME
zip -r $NAME.zip *
cd ..
mv $NAME/$NAME.zip .

