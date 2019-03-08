import React, { Component } from 'react'
import ReactNative, { UIManager, requireNativeComponent } from 'react-native'

import { WebView } from 'react-native-webview'

export class ProtocolWebView extends Component {
	static propTypes = WebView.propTypes;

	static protocolHandlers = {};

	static registerStreamProtocol = (scheme, handler, completion) => {
		ProtocolWebView.protocolHandlers[scheme] = (url, method, id, webview) => {
			handler({url, method}, (response) => {
				let stream = response;
				let mimeType = response.mimeType;
				if(response.data) {
					stream = response.data
				}

				if(!mimeType) {
					mimeType = stream.mimeType
				}

				webview._setResponseInfo(id, mimeType)

				stream.once('close', () => webview._finishResponse(id))
				stream.once('error', () => webview._finishResponse(id))
				stream.on('data', (data) => webview._respondWithData(id, data))
			})
		}
		if (typeof completion === 'function') completion(null)
	};

	static registerBufferProtocol = (scheme, handler, completion) => {
		ProtocolWebView.protocolHandlers[scheme] = (url, method, id, webview) => {
			handler({url, method}, (response) => {
				let buffer = response;
				let mimeType = response.mimeType;
				if(response.data) {
					buffer = response.data
				}

				if(!mimeType) {
					mimeType = buffer.mimeType
				}

				webview._setResponseInfo(id, mimeType)
				webview._respondWithData(id, buffer)
				webview._finishResponse(id)
			})
		}
		if (typeof completion === 'function') completion(null)
	};

	static registerStringProtocol = (scheme, handler, completion) => {
		ProtocolWebView.registerBufferProtocol(scheme, (request, cb) => {
			handler(request, (response) => {
				const string = response.data || response
				const mimeType = response.mimeType || 'text/plain'
				const charset = response.charset || 'utf-8'

				const buffer = Buffer.from(string, charset);

				cb({
					mimeType,
					charset,
					data: buffer
				})
			})
		})
	}

	static unregisterProtocol = (scheme, completion) => {
		delete ProtocolWebView.protocolHandlers[scheme]
		if (typeof completion === 'function') completion(null)
	}

	static _handleProtocol = (webview, event) => {
		const requestId = event.nativeEvent.request;
		const url = event.nativeEvent.url;
		const method = event.nativeEvent.method;

		console.log('Handling protocol', url, method, requestId);

		const protocolHandlers = ProtocolWebView.protocolHandlers

		for(let scheme of Object.keys(protocolHandlers)) {
			if(url.indexOf(`${scheme}:`) !== 0) continue
			const handler = protocolHandlers[scheme]
			handler(url, method, requestId, webview)
		}
	}

	webViewRef = React.createRef();

	render() {
		return (
			<WebView
				{...this.props}
				ref={this.webViewRef}
				nativeConfig={{
					component: ProtocolWebViewNative,
					props: {
						schemes: Object.keys(ProtocolWebView.protocolHandlers),
						onProtocolHandleStart: this._handleProtocolStart
					}
				}}
				/>
		);
	}

	_handleProtocolStart = (event) => {
		ProtocolWebView._handleProtocol(this, event);
	}

	_respondWithData = (requestId, buffer) => {
		console.log('Responding with', requestId, buffer)
		this.__dispatchCommand('_respondData', [requestId, buffer.toString('base64')])
	}

	_finishResponse = (requestId) =>{
		this.__dispatchCommand('_respondFinish', [requestId])
	}

	_setResponseInfo(requestId, mimeType, status) {
		const args = [requestId, mimeType]
		if(status) args.push(status)
		this.__dispatchCommand('_respondInfo', args)
	}

	__dispatchCommand(commandName, args) {
		const ref = this.webViewRef.current.webViewRef.current
		UIManager.dispatchViewManagerCommand(
			ReactNative.findNodeHandle(ref),
			UIManager.getViewManagerConfig('ProtocolWebView').Commands[commandName],
			args,
		);
	}
}

const ProtocolWebViewNative = requireNativeComponent(
	'ProtocolWebView',
	ProtocolWebView,
	WebView.extraNativeComponentConfig
);
