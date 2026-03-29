import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { fetchLinkPreview } from '../utils/linkPreview.utils.js';

export const getLinkPreview = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) throw new ApiError(400, 'URL required');

    let validUrl;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) throw new Error();
    } catch {
      throw new ApiError(400, 'Invalid URL');
    }

    const preview = await fetchLinkPreview(url);
    if (!preview) return res.json(new ApiResponse(200, null, 'Preview unavailable'));

    res.json(new ApiResponse(200, { preview }));
  } catch (error) {
    next(error);
  }
};
