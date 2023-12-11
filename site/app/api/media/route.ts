import {join, dirname, basename} from "@/utils/path";
import type {Media} from "tinacms";
import {
  type ListObjectsCommandInput,
  ListObjectsCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  type DeleteObjectCommandInput,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {getR2Client} from "@/lib/r2Client";
import {type NextRequest} from "next/server";

export async function GET(request: NextRequest) {
  const r2Client = getR2Client();
  const bucket = process.env.R2_BUCKET;
  let mediaRoot = ""; //todo investigate

  try {
    const url = new URL(request.url);
    const directory = url.searchParams.get("directory") || "";
    const limit = url.searchParams.get("limit") || "";
    const offset = url.searchParams.get("directory") || null;

    let prefix = directory.replace(/^\//, "").replace(/\/$/, "");
    if (prefix) prefix = prefix + "/";

    const params: ListObjectsCommandInput = {
      Bucket: bucket,
      Delimiter: "/",
      Prefix: prefix,
      Marker: offset?.toString(),
      MaxKeys: directory && !offset ? +limit + 1 : +limit,
    };

    const command = new ListObjectsCommand(params);
    const response = await r2Client.send(command);
    const items = [];

    response.CommonPrefixes?.forEach(({Prefix}) => {
      if (Prefix) {
        const strippedPrefix = stripMediaRoot({mediaRoot, key: Prefix});
        if (!strippedPrefix) {
          return;
        }
        items.push({
          id: Prefix,
          type: "dir",
          filename: basename(strippedPrefix),
          directory: dirname(strippedPrefix),
        });
      }
    });

    items.push(
      ...(response.Contents || [])
        .filter((file) => {
          if (!file.Key) return false;
          const strippedKey = stripMediaRoot({mediaRoot, key: file.Key});
          return strippedKey !== prefix;
        })
        .map(getS3ToTinaFunc(mediaRoot))
    );
    return new Response(
      JSON.stringify({
        items,
        offset: response.NextMarker,
      })
    );
  } catch (e) {
    // Show the error to the user
    console.error("Error listing media");
    console.error({e});
    return new Response(null, {
      status: 500,
    });
  }
}
export async function POST(request: NextRequest) {
  const r2Client = getR2Client();
  const bucket = process.env.R2_BUCKET;
  let mediaRoot = ""; //todo investigate
  try {
    const data = await request.formData();
    const directory = data.get("directory")?.toString()!;
    const file = data.get("file")! as File;
    const filename = data.get("filename");
    if (!filename)
      return new Response(null, {
        status: 400,
      });
    const nameOfFile = filename.toString();
    const finalPeriodIdx = nameOfFile.lastIndexOf(".");
    const extension = nameOfFile.slice(finalPeriodIdx);
    const name = filename.slice(0, finalPeriodIdx);
    const sluggedFileName = `${simpleSlugify(nameOfFile)}${extension}`;
    let prefix = directory.replace(/^\//, "").replace(/\/$/, "");
    if (prefix) prefix = prefix + "/";
    const fileBuff = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuff);

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: mediaRoot
        ? join(mediaRoot, prefix + sluggedFileName)
        : prefix + sluggedFileName,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    };
    const command = new PutObjectCommand(params);
    try {
      await r2Client.send(command);
      const src = prefix + filename;
      return new Response(
        JSON.stringify({
          type: "file",
          id: prefix + filename,
          filename,
          directory: prefix,
          thumbnails: {
            "75x75": src,
            "400x400": src,
            "1000x1000": src,
          },
          src: mediaRoot
            ? join(mediaRoot, prefix + filename)
            : prefix + filename,
        })
      );
    } catch (e) {
      console.error("Error uploading media to s3");
      console.error(e);
      return new Response(null, {
        status: 500,
      });
    }
  } catch (e) {
    console.error("Error uploading media");
    console.error(e);
    return new Response(null, {
      status: 500,
    });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asset = searchParams.get("del");
  const r2Client = getR2Client();
  const bucket = process.env.R2_BUCKET;

  if (!asset)
    return new Response(null, {
      status: 404,
    });
  const params: DeleteObjectCommandInput = {
    Bucket: bucket,
    Key: asset,
  };
  const command = new DeleteObjectCommand(params);

  try {
    const data = await r2Client.send(command);
    return new Response(JSON.stringify(data));
  } catch (e) {
    console.error("Error deleting media");
    console.error(e);
    return new Response(
      JSON.stringify({
        // @ts-ignore
        e: e?.message || "error occurred",
      }),
      {
        status: 500,
      }
    );
  }
}

function stripMediaRoot({mediaRoot, key}: {mediaRoot?: string; key: string}) {
  if (!mediaRoot) {
    return key;
  }
  const mediaRootParts = mediaRoot.split("/").filter((part) => part);
  if (!mediaRootParts || !mediaRootParts[0]) {
    return key;
  }
  const keyParts = key.split("/").filter((part) => part);
  // remove each part of the key that matches the mediaRoot parts
  for (let i = 0; i < mediaRootParts.length; i++) {
    if (keyParts[0] === mediaRootParts[i]) {
      keyParts.shift();
    }
  }
  return keyParts.join("/");
}

function getS3ToTinaFunc(mediaRoot?: string) {
  return function s3ToTina(file: any): Media {
    const strippedKey = stripMediaRoot({mediaRoot, key: file.Key});
    const filename = basename(strippedKey);
    const directory = dirname(strippedKey) + "/";

    // todo: make this an .env var and don't commit it?
    const src =
      `https://pub-938da10649b54fb7847fef1e18a1f52c.r2.dev/` + file.Key;
    return {
      id: file.Key,
      filename,
      directory,
      src: src,
      thumbnails: {
        "75x75": src,
        "400x400": src,
        "1000x1000": src,
      },
      type: "file",
    };
  };
}

function simpleSlugify(str: string) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
  str = str.toLowerCase(); // convert string to lowercase
  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens
  return str;
}
