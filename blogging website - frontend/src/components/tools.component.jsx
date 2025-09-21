import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Code from "@editorjs/code";
import Quote from "@editorjs/quote";
import InlineCode from "@editorjs/inline-code";
import Marker from "@editorjs/marker";
import Link from "@editorjs/link";
import InlineImage from "editorjs-inline-image";
import { uploadImageToCloudinary } from "../utils/cloudinary";

const uploadImageByUrl = (e) => {
  let link = new Promise((resolve, reject) => {
    try {
      resolve(e);
    } catch (err) {
      console.log(err);
    }
  });

  return link.then((url) => {
    return {
      success: 1,
      file: { url },
    };
  });
};

const uploadImageByFile = async (file) => {
  try {
    const result = await uploadImageToCloudinary(file);

    if (result.success) {
      return {
        success: 1,
        file: {
          url: result.url,
        },
      };
    } else {
      return {
        success: 0,
        error: result.error || "Upload failed",
      };
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: 0,
      error: error.message || "Upload failed",
    };
  }
};

export const tools = {
  embed: Embed,
  list: {
    class: List,
    inlineToolbar: true,
  },
  image: {
    class: InlineImage,
    inlineToolbar: true,
    config: {
      embed: {
        display: true,
      },
      unsplash: {
        appName: "blog-editor",
        apiUrl: "http://localhost:3000/unsplash",
        maxResults: 30,
        imageParams: {
          q: 85,
          w: 1500,
        },
      },
    },
  },
  header: {
    class: Header,
    config: {
      placeholder: "Type Heading...",
      levels: [2, 3],
      defaultLevel: 2,
    },
  },
  code: Code,
  quote: {
    class: Quote,
    inlineToolbar: true,
  },
  inlineCode: InlineCode,
  marker: Marker,
  link: Link,
};
