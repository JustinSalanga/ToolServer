import React, { useState, useEffect } from 'react';
import { GPTAPI } from '../services/api';
import { AlertModal } from '../components/Modal';

const GptSetting = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [currentModel, setCurrentModel] = useState('Loading...');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState('');
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  useEffect(() => {
    loadGPTModels();
  }, []);

  const loadGPTModels = async () => {
    try {
      setLoading(true);
      const [modelsData, selectedData, apiKeyData] = await Promise.all([
        GPTAPI.getAvailableModels(),
        GPTAPI.getSelectedModel(),
        GPTAPI.getApiKey(),
      ]);

      setModels(modelsData.models || []);
      const current = selectedData.selectedModel || 'gpt-3.5-turbo';
      setSelectedModel(current);
      const currentModelInfo = modelsData.models?.find((m) => m.id === current);
      setCurrentModel(currentModelInfo ? currentModelInfo.name : current);

      if (apiKeyData.isSet) {
        setApiKey(apiKeyData.apiKey);
        setApiKeyStatus('✅ API key is configured');
      } else {
        setApiKey('');
        setApiKeyStatus('⚠️ No API key configured');
      }
    } catch (error) {
      showAlert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleSelectModel = (modelId) => {
    setSelectedModel(modelId);
    setShowSaveButton(true);
  };

  const handleSaveModel = async () => {
    if (!selectedModel) {
      showAlert('No Model Selected', 'Please select a model first');
      return;
    }

    try {
      await GPTAPI.setSelectedModel(selectedModel);
      const modelInfo = models.find((m) => m.id === selectedModel);
      setCurrentModel(modelInfo ? modelInfo.name : selectedModel);
      setShowSaveButton(false);
      showAlert('Success', 'Model selection saved successfully!');
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const handleSaveApiKey = async () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setApiKeyStatus('❌ Please enter an API key');
      return;
    }

    if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 20) {
      setApiKeyStatus('❌ Invalid API key format (must start with sk- and be at least 20 characters)');
      return;
    }

    try {
      await GPTAPI.saveApiKey(trimmedKey);
      setApiKeyStatus('✅ API key saved successfully!');
      setTimeout(() => {
        loadGPTModels();
      }, 1000);
    } catch (error) {
      setApiKeyStatus('❌ Error: ' + error.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">GPT Model Selection</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-2">🔑 OpenAI API Key</h3>
        <p className="text-gray-600 mb-4">Configure your OpenAI API key to enable GPT model functionality.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <div className="flex gap-2">
            <input
              type={apiKeyVisible ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {apiKeyVisible ? '🙈' : '👁️'}
            </button>
          </div>
          <small className={`block mt-1 ${apiKeyStatus.includes('✅') ? 'text-green-600' : apiKeyStatus.includes('⚠️') ? 'text-orange-600' : apiKeyStatus.includes('❌') ? 'text-red-600' : 'text-gray-500'}`}>
            {apiKeyStatus}
          </small>
        </div>
        <button
          onClick={handleSaveApiKey}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
        >
          💾 Save API Key
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-2">Choose Your Preferred GPT Model</h3>
        <p className="text-gray-600 mb-4">
          Select the AI model that best suits your needs. The selected model will be saved and used across the application.
        </p>

        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <strong>Currently Selected:</strong> <span className="text-primary">{currentModel}</span>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading available models...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {models.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">No models available</div>
              ) : (
                models.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleSelectModel(model.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedModel === model.id
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{model.name}</h4>
                      {selectedModel === model.id && (
                        <span className="text-primary text-xl">✓</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 block mb-2">{model.id}</span>
                    <p className="text-sm text-gray-600">{model.description}</p>
                  </div>
                ))
              )}
            </div>

            {showSaveButton && (
              <button
                onClick={handleSaveModel}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
              >
                Save Selection
              </button>
            )}
          </>
        )}
      </div>

      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertTitle}
        message={alertMessage}
      />
    </div>
  );
};

export default GptSetting;
