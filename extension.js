const St = imports.gi.St;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Util = imports.misc.util;

PanelMenu.SystemStatusButton.prototype.updateActor = function(_newActor){
    this._iconActor = _newActor;
    this.actor.set_child(this._iconActor);
}

function DoIt() {
    this._init.apply(this, arguments);
}

DoIt.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,
	
    _init: function(){
        PanelMenu.SystemStatusButton.prototype._init.call(this, '', 'CPU Temperature');
	let section = new PopupMenu.PopupMenuSection("Temperature");
        this._update_temp();
	//update every 15 seconds
	GLib.timeout_add(0, 15000,
        Lang.bind(this,
        function () {
            this._update_temp();
            return true;
        }));
		
    },
	
    _update_temp: function(){
	let title='Error';
	let content='Click here to report!';
	let command=["firefox","http://github.com/xtranophilist/gnome-shell-extension-cpu-temperature/issues/"];
        let d=0;
        let f = new Array();
        f[0]='/sys/bus/acpi/devices/LNXTHERM\:00/thermal_zone/temp';
        f[1]='/sys/devices/virtual/thermal/thermal_zone0/temp';
        f[2]='/sys/bus/acpi/drivers/ATK0110/ATK0110:00/hwmon/hwmon0/temp1_input';
	f[3]='/sys/devices/platform/coretemp.0/temp1_input';
	f[4]='/sys/class/hwmon/hwmon0/temp1_input';
        let c=0;
        let temperature;
        for (let i=0;i<f.length;i++){
            if(GLib.file_test(f[i],1<<4)){
                temperature = GLib.file_get_contents(f[i]);
                if(temperature[0]){
                    c = parseInt(temperature[1])/1000;
                    title=getTitle(c);
                    content=getContent(c);
                    command=["echo"];
                    d=1;
                    }
		if (d) break;
            }

        }
 
        if (d==0){
            let f = new Array();
            let s=0;
            f[0]='/usr/bin/sensors';
            f[1]='/bin/sensors';
            for (let i=0;i<f.length;i++){
                if(GLib.file_test(f[i],1<<4)) s=f[i];
		if (s) break;
            }
            if(s){
                let senses = GLib.spawn_command_line_sync(s);
                if(senses[0]){
                    let temp=findTemperatureFromSensorsOutput(senses[1]);
                    title=getTitle(temp);
                    content=getContent(temp);
                    command=["echo"];
                }
            }
            else{
                title="Warning";
                content="Please install lm-sensors";
                command=["echo"];
            }
        }
        this.statusLabel = new St.Label({
            text: (title)
        });
        let children = this.menu.box.get_children();
        for (let i=0; i < children.length; i++) {
            children[i].destroy();
        }
        let section = new PopupMenu.PopupMenuSection("Temperature");
        this.menu.addMenuItem(section);
        let item = new PopupMenu.PopupMenuItem("");
        item.addActor(new St.Label({ text:content, style_class: "sm-label"}));
        item.connect(
        'activate',
        function() {
            Util.spawn(command);
        });
        section.addMenuItem(item);
        this.updateActor(this.statusLabel);
    }
}

function findTemperatureFromSensorsOutput(text){
    let senses_lines=text.split("\n");
    let line = '';
    let s=0;
    let n=0;
    //iterate through each lines
    for(var i = 0; i < senses_lines.length; i++) {
        line = senses_lines[i];
        //check for adapter
        if (isAdapter(line)){
            let type=line.substr(9,line.length-9);
            let c=0;
            switch (type){
                case 'Virtual device':
                    //starting from the next line, loop, also increase the outer line counter i
                    for (var j=i+1;;j++,i++){
                        //continue only if line exists and isn't adapter
                        if(senses_lines[j] && !isAdapter(senses_lines[j])){
                            if(senses_lines[j].substr(0,5)=='temp1'){
                                //remove all space characters
                                senses_lines[j]=senses_lines[j].replace(/\s/g, "");
                                s+=parseFloat(senses_lines[j].substr(7,4));
                                n++;
                                //set break flag on, look for temperature no-more
                                c=1;    
                            };
                        }
                        else break;
                    }
                    
                    break;
                case 'ACPI interface':
                    //starting from the next line, loop, also increase the outer line counter i
                    for (var j=i+1;;j++,i++){
                        //continue only if line exists and isn't adapter
                        if(senses_lines[j] && !isAdapter(senses_lines[j])){
                            if(senses_lines[j].substr(0,15)=='CPU Temperature'){
                                senses_lines[j]=senses_lines[j].replace(/\s/g, "");
                                s+=parseFloat(senses_lines[j].substr(16,4));
                                n++;
                                //set break flag on, look for temperature no-more
                                c=1;
                            };
                        }
                        else break;
                    }
                    break;
                case 'ISA adapter':
                    //starting from the next line, loop, also increase the outer line counter i
                    for (var j=i+1;;j++,i++){
                        //continue only if line exists and isn't adapter
                        if(senses_lines[j] && !isAdapter(senses_lines[j])){
                            if(senses_lines[j].substr(0,4)=='Core'){
                                senses_lines[j]=senses_lines[j].replace(/\s/g, "");
                                s+=parseFloat(senses_lines[j].substr(7,4));
                                n++;
                            };
                        }
                        else break;
                    }
                    break;
                default:
                    break;
            }
            if (c==1) break;
        }
                
    }
    return(s/n);
}
            

function isAdapter(line){
    if (line.substr(0, 8)=='Adapter:') return true;
    else return false;
}

function toFahrenheit(c){
    return ((9/5)*c+32).toFixed(1);
}

function getContent(c){
    return c.toString()+"\u1d3cC / "+toFahrenheit(c).toString()+"\u1d3cF";
}

function getTitle(c){
    return c.toString()+"\u1d3cC";
    //comment the last line and uncomment the next line to display temperature in Fahrenheit
    //return toFahrenheit(c).toString()+"\u1d3cF";
}

function main() {
    Panel.STANDARD_TRAY_ICON_ORDER.unshift('temperature');
    Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['temperature'] = DoIt;
}
