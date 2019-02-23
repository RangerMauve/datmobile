# datmobile

A mobile app for viewing Dat Archives. Drive all around the P2P web with your phone. Pronounced like the famous hero's car.

## Plans:

- [x] Set up RN project (Start with Android for now)
- [ ] Get hyperdrive running in RN
	- [x] Get node builtin modules working [rn-nodeify](https://github.com/tradle/rn-nodeify)
- [ ] Get hyperdrive replicating with dat-gateway through websockets
- [ ] Make a viewer similar to [dat-js-example](https://github.com/RangerMauve/dat-js-example)
	- [ ] Load Dat from URL bar
	- [ ] View with some default URLs to visit
	- [ ] Directory listing
	- [ ] View text files in a Text element
	- [ ] Markdown support through some component
	- [ ] HTML viewier with a webview (Won't support relative URLs or dat://protocol)
- [ ] Get discovery-swarm to work with RN in the JS thread
	- [ ] Identify the node modules that need to run in RN
	- [ ] Use discovery-swarm instead of gateway
- [ ] Support dat protocol as a browser
	- [ ] Find how to support custom protocols in Webview (Android)
	- [ ] Create custom native WebView component which adds support for this funcionality
	- [ ] Create DatWebview which adds support for `dat://` protocol
	- [ ] Make browser UI with the new webview, replacing the viewer functionality
	- [ ] Support version portion of `dat://` URL
- [ ] Keep track of history and view / clear it
- [ ] DatArchive API
- [ ] Extract WebView into own library
- [ ] Extract Dat mechanics into `react-native-dat`
- [ ] Extras!
	- [ ] experimental.datPeers API
	- [ ] Add Blocklist for trackers and ads

## Contributing:

- Changes are very much welcome!
- Please open an issue if you have an idea for a change before doing a PR.
- Please use the ["standard"](https://standardjs.com/) code style.