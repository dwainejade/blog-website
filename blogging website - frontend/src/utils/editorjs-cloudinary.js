import { uploadImageToCloudinary } from './cloudinary';

export const createCloudinaryImageTool = () => {
  return {
    class: class CloudinaryImageTool {
      constructor({ data, config, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.config = config || {};
        this.data = {
          file: data.file || {},
          caption: data.caption || '',
          withBorder: data.withBorder !== undefined ? data.withBorder : false,
          withBackground: data.withBackground !== undefined ? data.withBackground : false,
          stretched: data.stretched !== undefined ? data.stretched : false,
        };
        this.wrapper = undefined;
        this.settings = [
          {
            name: 'withBorder',
            icon: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.8 10.592v2.043h2.35v2.138H15.8v2.232h-2.25v-2.232h-2.4v-2.138h2.4v-2.043h2.25zm-13.5 0v2.043H4.3v2.138H2.3v2.232H.05v-2.232H2.3V12.635H.05v-2.138H2.3v-2.043H4.3z"></path></svg>`
          },
          {
            name: 'stretched',
            icon: `<svg width="17" height="10" viewBox="0 0 17 10" xmlns="http://www.w3.org/2000/svg"><path d="M13.568 5.925H4.056l1.703 1.703a1.125 1.125 0 0 1-1.59 1.591L.962 6.014A1.069 1.069 0 0 1 .588 4.26L4.38.469a1.069 1.069 0 0 1 1.512 1.511L4.084 3.787h9.606l-1.85-1.85a1.069 1.069 0 1 1 1.512-1.51l3.792 3.791a1.069 1.069 0 0 1-.475 1.788L13.514 9.16a1.125 1.125 0 0 1-1.59-1.591l1.644-1.644z"></path></svg>`
          },
          {
            name: 'withBackground',
            icon: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.043 8.265l3.183-3.183h-2.924L4.75 10.636v2.923l4.15-4.15v2.351l-2.158 2.159H8.9v2.137H4.7c-1.215 0-2.2-.936-2.2-2.09v-8.93c0-1.154.985-2.09 2.2-2.09h10.663c1.215 0 2.2.936 2.2 2.09v3.183L15.4 9.5z"></path></svg>`
          }
        ];
      }

      static get toolbox() {
        return {
          title: 'Image',
          icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 66-39 32 40zm0 52l-43-54-58 34-81-72-59 39v35c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
        };
      }

      render() {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('image-tool');

        if (this.data && this.data.file && this.data.file.url) {
          this._createImage(this.data.file.url, this.data.caption);
          return this.wrapper;
        }

        const onUpload = (file) => {
          return this._uploadImage(file);
        };

        this.uploader = new FileUploader({
          uploadByFile: onUpload,
        });

        const uploadButton = this._createUploadButton();
        this.wrapper.appendChild(uploadButton);

        return this.wrapper;
      }

      _createUploadButton() {
        const button = document.createElement('div');
        button.classList.add('image-tool__image-preloader');
        button.innerHTML = `
          <div class="image-tool__upload-button">
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.15 13.628A7.749 7.749 0 0 0 10 19a7.74 7.74 0 0 0 5.632-2.37l1.115 1.115A9.7 9.7 0 0 1 10 20.75a9.74 9.74 0 0 1-8.632-5.3l1.782-.822zM1.368 6.632A7.75 7.75 0 0 1 10 1a7.74 7.74 0 0 1 6.845 4.073l1.115-1.115A9.7 9.7 0 0 0 10-.25 9.74 9.74 0 0 0 .25 6.632l1.118.632z"/>
              <rect x="9" y="4" width="2" height="12" rx="1"/>
              <rect x="4" y="9" width="12" height="2" rx="1"/>
            </svg>
            Select an image
          </div>
          <input type="file" accept="image/*" style="display: none;">
        `;

        const input = button.querySelector('input');
        const uploadDiv = button.querySelector('.image-tool__upload-button');

        uploadDiv.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            this._uploadImage(file);
          }
        });

        return button;
      }

      async _uploadImage(file) {
        try {
          this.wrapper.innerHTML = '<div class="image-tool__loading">Uploading...</div>';

          const result = await uploadImageToCloudinary(file);

          if (result.success) {
            this.data.file = {
              url: result.url,
              width: result.width,
              height: result.height,
              size: file.size
            };

            this._createImage(result.url);
            return this.data;
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          this.wrapper.innerHTML = `<div class="image-tool__error">Upload failed: ${error.message}</div>`;
          throw error;
        }
      }

      _createImage(url, captionText) {
        this.wrapper.innerHTML = '';

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-tool__image');

        const imageEl = document.createElement('img');
        imageEl.src = url;
        imageEl.addEventListener('load', () => {
          this.wrapper.classList.add('image-tool--filled');
        });

        imageContainer.appendChild(imageEl);
        this.wrapper.appendChild(imageContainer);

        if (!this.readOnly) {
          const caption = document.createElement('div');
          caption.classList.add('image-tool__caption');
          caption.contentEditable = true;
          caption.innerHTML = captionText || 'Enter caption';
          caption.addEventListener('blur', () => {
            this.data.caption = caption.innerHTML;
          });

          this.wrapper.appendChild(caption);
        }

        this._acceptTuneView();
      }

      _acceptTuneView() {
        this.settings.forEach((tune) => {
          const el = this.wrapper.querySelector(`.image-tool__image`);

          if (el) {
            el.classList.toggle(`image-tool__image--${tune.name}`, !!this.data[tune.name]);

            if (tune.name === 'stretched') {
              this.api.blocks.stretchBlock(this.api.blocks.getCurrentBlockIndex(), !!this.data.stretched);
            }
          }
        });
      }

      renderSettings() {
        return this.settings.map((tune) => ({
          icon: tune.icon,
          label: this.api.i18n.t(tune.name),
          name: tune.name,
          toggle: tune.type === 'button',
          isActive: this.data[tune.name],
          onActivate: () => {
            this.data[tune.name] = !this.data[tune.name];
            this._acceptTuneView();
          }
        }));
      }

      save(blockContent) {
        const image = blockContent.querySelector('img');
        const caption = blockContent.querySelector('.image-tool__caption');

        if (!image) {
          return null;
        }

        return Object.assign(this.data, {
          caption: caption ? caption.innerHTML : '',
        });
      }

      static get pasteConfig() {
        return {
          patterns: {
            image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png|svg|webp)(\?[a-z0-9=]*)?$/i,
          },
          files: {
            mimeTypes: ['image/*'],
          },
        };
      }

      onPaste(event) {
        switch (event.type) {
          case 'tag': {
            const img = event.detail.data;
            this._createImage(img.src);
            break;
          }

          case 'pattern': {
            const url = event.detail.data;
            this._createImage(url);
            break;
          }

          case 'file': {
            const file = event.detail.file;
            this._uploadImage(file);
            break;
          }
        }
      }
    }
  };
};

class FileUploader {
  constructor({ uploadByFile }) {
    this.uploadByFile = uploadByFile;
  }
}