import React from 'react'
import ReactNative, { UIManager } from 'react-native'

import { WebView } from 'react-native-webview'

export default class ProtocolWebView {
	static propTypes = WebView.propTypes;

	static protocolHandlers = {};

	static registerStreamProtocol = (scheme, handler, completion) => {
		WebView.protocolHandlers[scheme] = (url, method, id, webview) => {
			// Request has .url and .method
			handler(request, (err, stream) => {
				if (err) return webview._finishResponse(id)
				if (!stream.on) stream = stream.data

				stream.once('close', () => webview._finishResponse(id))
				stream.once('error', () => webview._finishResponse(id))
				stream.on('data', (data) => webview._respondeWithData(id, data.buffer))
			})
		}
		if (typeof completion === 'function') completion(null)
	};

	static unregisterProtocol = (scheme, completion) => {
		delete WebView.protocolHandlers[scheme]
		if (typeof completion === 'function') completion(null)
	}

	static _handleProtocol = (webview, event) => {
		const requestId = event.nativeEvent.request;
		const url = event.nativeEvent.url;
		const method = event.nativeEvent.method;

		console.log('Handling protocol', url, method, requestId);
	}

	constructor(props) {
		super(props)

		this.webview = null
	}

	render() {
		return (
			<WebView
				{...this.props}
				ref={ref => this.webview = ref}
				nativeConfig={{
					component: ProtocolWebView,
					onProtocolHandleStart: this._handleProtocolStart
				}}
				/>
		);
	}

	_handleProtocolStart = (event) => {
		ProtocolWebView._handleProtocol(this, event);
	}

	_respondWithData(requestId, buffer) {
		UIManager.dispatchViewManagerCommand(
			ReactNative.findNodeHandle(this.webview),
			this.getViewManagerConfig('RNCWebView').Commands._respondData,
			[requestId, buffer.toString('base64')],
		);
	}

	_finishResponse(requestId) {
		UIManager.dispatchViewManagerCommand(
			ReactNative.findNodeHandle(this.webview),
			this.getViewManagerConfig('RNCWebView').Commands._respondFinish,
			[requestId],
		);
	}
}

const ProtocolWebView = requireNativeComponent(
	'ProtocolWebView',
	CustomWebView,
	WebView.extraNativeComponentConfig
);
