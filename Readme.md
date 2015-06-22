dfscore
=======
dfscore is a browser-based client/server dynamic score performance system. 

Requirements
============
node.js
http://nodejs.org

Installation
============
Clone the repository / download and unpack zip file to a directory.

Running
=======
Execute "node dfscore" from a terminal in the directory containing the
clone/unpacked zip file.

config.json contains the configuration options including listenAddress
and serverPort which specify where dfscore will run. The defaults will
work for a local installation, making dfscore accessible in a browser via
http://localhost:8080

Usage
=====
The admin user is specified in config.json. By default you can log in
with 'admin' and 'password'.
See http://dfs.1bpm.net for usage and composition details.