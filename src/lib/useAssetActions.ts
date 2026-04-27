import { useAppStore } from './store';
import { generateId, fileToBase64 } from './utils';
import { ImageAsset } from '../types';

interface AssetActionOptions {
  onAdded?: (asset: ImageAsset) => void;
  onRemoved?: (assetId: string) => void;
}

export function useAssetActions() {
  const { state, dispatch } = useAppStore();

  const addAsset = (asset: ImageAsset, options?: AssetActionOptions) => {
    dispatch({ type: 'ADD_ASSET', payload: asset });
    options?.onAdded?.(asset);
    return asset;
  };

  const addUploadAssetFromFile = async (file: File, options?: AssetActionOptions) => {
    const b64 = await fileToBase64(file);
    const asset: ImageAsset = {
      id: generateId('IMG_'),
      name: file.name,
      url: b64,
      source: 'upload',
      createdAt: Date.now(),
      workspaceId: state.activeWorkspaceId,
    };
    return addAsset(asset, options);
  };

  const addUploadAssetFromUrl = (imageUrl: string, options?: AssetActionOptions) => {
    const parsedUrl = new URL(imageUrl.trim());
    const fileName = parsedUrl.pathname.split('/').filter(Boolean).pop() || parsedUrl.hostname;
    const asset: ImageAsset = {
      id: generateId('IMG_'),
      name: fileName,
      url: parsedUrl.toString(),
      source: 'upload',
      createdAt: Date.now(),
      workspaceId: state.activeWorkspaceId,
    };
    return addAsset(asset, options);
  };

  const removeAsset = (assetId: string, options?: AssetActionOptions) => {
    dispatch({ type: 'REMOVE_ASSET', payload: assetId });
    options?.onRemoved?.(assetId);
  };

  return {
    addAsset,
    addUploadAssetFromFile,
    addUploadAssetFromUrl,
    removeAsset,
  };
}
