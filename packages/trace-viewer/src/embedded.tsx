/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import '@web/common.css';
import { applyTheme, currentTheme, toggleTheme } from '@web/theme';
import '@web/third_party/vscode/codicon.css';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { WorkbenchLoader } from './ui/workbenchLoader';
import { setPopoutFunction } from './ui/popout';

(async () => {
  applyTheme();

  // must run before awaits
  window.addEventListener('message', ({ data }) => {
    if (!data.theme)
      return;
    if (currentTheme() !== data.theme)
      toggleTheme();
  });
  // workaround to send keystrokes back to vscode webview to keep triggering key bindings there
  const handleKeyEvent = (e: KeyboardEvent) => {
    if (!e.isTrusted)
      return;
    window.parent?.postMessage({
      type: e.type,
      key: e.key,
      keyCode: e.keyCode,
      code: e.code,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      repeat: e.repeat,
    }, '*');
  };
  window.addEventListener('keydown', handleKeyEvent);
  window.addEventListener('keyup', handleKeyEvent);

  if (window.location.protocol !== 'file:') {
    if (window.location.href.includes('isUnderTest=true'))
      await new Promise(f => setTimeout(f, 1000));
    if (!navigator.serviceWorker)
      throw new Error(`Service workers are not supported.\nMake sure to serve the Trace Viewer (${window.location}) via HTTPS or localhost.`);
    navigator.serviceWorker.register('sw.bundle.js');
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>(f => {
        navigator.serviceWorker.oncontrollerchange = () => f();
      });
    }

    // Keep SW running.
    setInterval(function() { fetch('ping'); }, 10000);
  }

  setPopoutFunction((url: string, target?: string) => {
    if (!url)
      return;
    window.parent.postMessage({ command: 'openExternal', url, target }, '*');
  });

  ReactDOM.render(<WorkbenchLoader embedded={true} />, document.querySelector('#root'));
})();
