# log-time

Easily log time spent on your notebook, distinguish between personal and work hours.

Premises: 
- I *don't* need to track projects
- I just want to track personal and working time slots. Automatically. 
- The time tracking should auto-stop/resume on notebook standby/wake. 
- It should *not* autopause on inactivity as i'm often not on my notebook while pair-programming.


<img width="461" alt="screen shot 2016-07-03 at 14 48 21" src="https://cloud.githubusercontent.com/assets/3755413/16545501/45de5f58-412d-11e6-8407-fa54897ee9dc.png">

### Setup
Basic idea: another tool (for example Keyboard Maestro for MacOS) triggers a bash script on notebook standby and wake up, plus provides two key bindings for triggering the same script, setting the "work mode" ("personal" or "work").
The script looks like this:

```bash
# file: log-time-add-entry (executable on your PATH)
DATE=$(date +"%Y-%m-%dT%H:%M:%S+0100")
echo "{\"date\": \"${DATE}\", \"action\": \"$1\"}" >> ~/.time/log.txt
(cd ~/.time && git commit -am "${DATE}")
```

The script depends on the folder `~/.time` and a initialized git repo in that folder to backup each log entry.

- The script call for the sleep event looks like `log-time-add-entry sleep`
- The script call for the wake event looks like `log-time-add-entry wake`
- The script call for keyboard shortcut to set the work mode to "personal" looks like `log-time-add-entry personal`
- The script call for keyboard shortcut to set the work mode to "work" looks like `log-time-add-entry work`

Calling the script appends a JSON-object with the current `date` and the `action` supplied via cli arg `$1`.

`~/time/log.txt` will look like:

```
...
{"date": "2016-07-03T13:39:00+0100", "action": "wake"}
{"date": "2016-07-03T13:47:06+0100", "action": "work"}
{"date": "2016-07-03T13:50:41+0100", "action": "personal"}
{"date": "2016-07-03T13:51:20+0100", "action": "sleep"}
{"date": "2016-07-03T13:51:25+0100", "action": "wake"}
{"date": "2016-07-03T14:02:35+0100", "action": "work"}
{"date": "2016-07-03T14:02:51+0100", "action": "personal"}
{"date": "2016-07-03T14:04:29+0100", "action": "personal"}
{"date": "2016-07-03T14:04:36+0100", "action": "work"}
{"date": "2016-07-03T14:15:28+0100", "action": "personal"}
{"date": "2016-07-03T14:18:16+0100", "action": "personal"}
{"date": "2016-07-03T14:18:23+0100", "action": "work"}
{"date": "2016-07-03T14:20:34+0100", "action": "personal"}
{"date": "2016-07-03T14:23:11+0100", "action": "sleep"}
{"date": "2016-07-03T14:23:17+0100", "action": "wake"}
...
```

The advantage of this file based format is that it's 
- trivial to manually correct when something went wrong 
- automatically backup-ed via git.

### Run
Calling `node index.js` (feel free to `ln -s` this into a nice script name in your path) from this repo should give you a breakdown per week of your personal and work-related hours as seen in the screensho above.
