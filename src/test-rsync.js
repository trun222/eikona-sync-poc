const Rsync = require('rsync');

// var rsync = new Rsync()
//   .shell('ssh')
//   .flags('az')
//   .source('/path/to/source')
//   .destination('server:/path/to/destination');
// Build the command
const rsync = new Rsync()
    .shell('ssh')
    .flags('avz')
    .progress()
    .source('/Users/trun222/Pictures/Blog_Assets/')
    .destination('aragorn@192.168.86.228:/home/aragorn/public');
// execute with stream callbacks
const rsyncPid = rsync.execute(
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