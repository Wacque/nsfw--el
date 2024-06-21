import React, { useState, useEffect } from 'react';

const TARGET_URL = 'https://s.weibo.com/';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);

  const handleStartTest = () => {
    void window.electron.startTest(url);
  };

  const handleStartRecorder = () => {
    void window.electron.startRecorder(TARGET_URL);
    setRecording(true);
  };

  const handleStopRecorder = () => {
    void window.electron.stopRecorder();
    setRecording(false);
  };

  const handleRunSpec = () => {
    void window.electron.runSpec();
  };

  useEffect(() => {
    window.electron.onTestOutput((message) => {
      setOutput((prevOutput) => [...prevOutput, message]);
    });

    window.electron.onRecorderStarted(() => {
      setRecording(true);
    });

    window.electron.onRecorderStopped(() => {
      setRecording(false);
    });
  }, []);

  return (
    <div>
      <h1>Test a Page with Playwright</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStartTest();
        }}
      >
        <label htmlFor="url">URL:</label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit">Start Test</button>
      </form>
      <button onClick={handleStartRecorder} disabled={recording}>
        Start Recorder
      </button>
      <button onClick={handleStopRecorder} disabled={!recording}>
        Stop Recorder
      </button>
      <button onClick={handleRunSpec}>Run Test Spec</button>
      <pre>
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </pre>
    </div>
  );
};

export default App;
