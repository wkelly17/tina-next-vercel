import {DEFAULT_MEDIA_UPLOAD_TYPES, type MediaStore} from "tinacms";
import type {
  Media,
  MediaList,
  MediaListOptions,
  MediaUploadOptions,
} from "tinacms";

export default class r2MediaStore implements MediaStore {
  accept = DEFAULT_MEDIA_UPLOAD_TYPES;

  async list(options: MediaListOptions): Promise<MediaList> {
    const query = this.buildQuery(options);

    const response = await fetch("/api/media" + query);
    const {items, offset} = await response.json();
    return {
      items: items,
      nextOffset: offset,
    };
  }
  async persist(media: MediaUploadOptions[]): Promise<Media[]> {
    const newFiles: Media[] = [];

    for (const item of media) {
      const {file, directory} = item;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("directory", directory);
      formData.append("filename", file.name);

      const res = await fetch(`/api/media`, {
        method: "POST",
        body: formData,
      });

      if (res.status != 200) {
        const responseData = await res.json();
        throw new Error(responseData.message);
      }
      const fileRes = await res.json();
      /**
       * Images uploaded to S3 aren't instantly available via the API;
       * waiting a couple seconds here seems to ensure they show up in the next fetch.
       */
      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });
      /**
       * Format the response from S3 to match Media interface
       * Valid S3 `resource_type` values: `image`, `video`, `raw` and `auto`
       * uploading a directory is not supported as such, type is defaulted to `file`
       */

      newFiles.push(fileRes);
    }
    return newFiles;
  }
  async delete(media: Media): Promise<void> {
    await fetch(`/api/media?del=${encodeURIComponent(media.id)}`, {
      method: "DELETE",
    });
  }

  private buildQuery(options: Record<string, any>) {
    const params = Object.keys(options)
      .filter((key) => options[key] !== "" && options[key] !== undefined)
      .map((key) => `${key}=${options[key]}`)
      .join("&");

    return `?${params}`;
  }
}
