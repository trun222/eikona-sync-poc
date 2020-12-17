var Rsync = require('rsync');

// Build the command
var rsync = new Rsync()
    .flags('avz')
    .progress()
    .source('/Users/trun222/Nextcloud/')
    .destination('/Users/trun222/Eikona-Output');
// execute with stream callbacks
var rsyncPid = rsync.execute(
    function (error, code, cmd) {
        console.log(cmd);
        // we're done
    }, function(data){
        // do things like parse progress
        console.log(data.toString());
    }, function(data) {
        // do things like parse error output
    }
);