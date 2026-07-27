import { progress } from './progress.js';
import { cache } from '../../connection/cache.js';

export const image = (() => {

    /**
     * @type {NodeListOf<HTMLImageElement>|null}
     */
    let images = null;

    /**
     * @type {ReturnType<typeof cache>|null}
     */
    let c = null;

    /**
     * @type {object[]}
     */
    const urlCache = [];

    const randomGallery = () => {

    const photos = [
        "./assets/images/IMG_0143.JPG",
        "./assets/images/IMG_0146.JPG",
        "./assets/images/IMG_0147.JPG",
        "./assets/images/IMG_0149.JPG",
        "./assets/images/IMG_0157.JPG",
        "./assets/images/IMG_9201.JPG",
        "./assets/images/IMG_9215.JPG",
        "./assets/images/IMG_9227.JPG",
        "./assets/images/IMG_9247.JPG",
        "./assets/images/IMG_9254.JPG",
        "./assets/images/IMG_9256.JPG",
        "./assets/images/IMG_0169.JPG"
    ];

    // Acak urutan foto
    const shuffled = [...photos].sort(() => Math.random() - 0.5);

    // Cari semua gambar yang ingin diacak
    const targets = document.querySelectorAll(".gallery-random");

    targets.forEach((img, index) => {
        if (shuffled[index]) {
            img.dataset.src = shuffled[index];
        }
    });
};
    /**
     * @param {string} src 
     * @returns {Promise<HTMLImageElement>}
     */
    const loadedImage = (src) => new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
    });

    /**
     * @param {HTMLImageElement} el 
     * @param {string} src 
     * @returns {Promise<void>}
     */
    const appendImage = (el, src) => loadedImage(src).then((img) => {
        el.width = img.naturalWidth;
        el.height = img.naturalHeight;
        el.classList.remove('opacity-0');
        el.src = img.src;
        img.remove();

        progress.complete('image');
    });

    /**
     * @param {HTMLImageElement} el 
     * @returns {void}
     */
    const getByFetch = (el) => {
        urlCache.push({
            url: el.getAttribute('data-src'),
            res: (url) => appendImage(el, url),
            rej: (err) => {
                console.error(err);
                progress.invalid('image');
            },
        });
    };

    /**
     * @param {HTMLImageElement} el 
     * @returns {void}
     */
    const getByDefault = (el) => {
        el.onerror = () => progress.invalid('image');
        el.onload = () => {
            el.width = el.naturalWidth;
            el.height = el.naturalHeight;
            progress.complete('image');
        };

        if (el.complete && el.naturalWidth !== 0 && el.naturalHeight !== 0) {
            progress.complete('image');
        } else if (el.complete) {
            progress.invalid('image');
        }
    };

    /**
     * @returns {boolean}
     */
    const hasDataSrc = () =>     
        Array.from(images).some((i) => {
        const src = i.getAttribute('data-src');
        return src && src.trim() !== '';
    });
    /**
     * @returns {Promise<void>}
     */
    const load = async () => {
        const imgs = Array.from(images);

        /**
         * @param {function} filter 
         * @returns {Promise<void>}
         */
        const runGroup = async (filter) => {
            urlCache.length = 0;
            imgs.filter(filter).forEach((el) => {
            const dataSrc = el.getAttribute('data-src');

            if (dataSrc && dataSrc.trim() !== '') {
                getByFetch(el);
            } else {
                getByDefault(el);
            }
            });
            await c.run(urlCache, progress.getAbort());
        };

        await runGroup((el) => el.hasAttribute('fetchpriority'));
        await runGroup((el) => !el.hasAttribute('fetchpriority'));
    };

    /**
     * @param {string} blobUrl 
     * @returns {void}
     */
    const download = (blobUrl) => {
        c.download(blobUrl, `${window.location.hostname}_image_${Date.now()}`);
    };

    /**
     * @returns {object}
     */
    const init = () => {
        c = cache('image').withForceCache();
        randomGallery();
        images = document.querySelectorAll('img');
        images.forEach(progress.add);

        return {
            load,
            download,
            hasDataSrc,
        };
    };

    return {
        init,
    };
})();