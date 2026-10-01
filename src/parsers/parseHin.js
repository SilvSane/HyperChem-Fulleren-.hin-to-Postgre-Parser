import fs from "node:fs";

async function ReadForlder(path) {
  let rdStat = new Promise((resolve, reject) => {
    fs.readdir(path, (err, filesList) => {
      if (err) reject(err);
      else {
        resolve(filesList);
      }
    });
  });
  rdStat.then((result) => {
    console.log(result);
  });
  rdStat.catch((err) => {
    console.log(err);
  });
}

//ReadForlder("n:/Computer Moduling Physics/fullerens");

const readFileAsync = (path) => {
  return fs.promises.readFile(path, { encoding: "utf-8" });
};

const parseFullerenFromPath = async (fpath) => {
  try {
    const fullerenInfo = await readFileAsync(fpath);

    const first = fullerenInfo.indexOf("mol");
    const last = fullerenInfo.indexOf("endmol");

    const startPos = fullerenInfo.indexOf("\n", first);
    const endPos = fullerenInfo.lastIndexOf("\n", last);

    const dataBlock = fullerenInfo.substring(startPos + 1, endPos);
    const lines = dataBlock.trim().split("\n");

    const fullerData = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // skip if not atom data
      if (!line.startsWith("atom")) {
        continue;
      }

      const tokens = line.split(/\s+/);

      //  .hin Structure format:
      // tokens[0] = 'atom'
      // tokens[1] = atom number
      // tokens[2] = '-'
      // tokens[3] = 'C' Chem Element type
      // tokens[4] = any marker like ('**' или 'CA')
      // tokens[5] = '-' sometimes

      // find ('**' or 'CA')
      const markerIndex = tokens.findIndex((t) => t === "**" || t === "CA");

      // skip marker and '-'
      const dataStart = markerIndex + 2;

      const energy = parseFloat(tokens[dataStart]);
      const x = parseFloat(tokens[dataStart + 1]);
      const y = parseFloat(tokens[dataStart + 2]);
      const z = parseFloat(tokens[dataStart + 3]);
      const connectionCount = parseInt(tokens[dataStart + 4], 10);

      const cons = [];
      const conTypes = [];

      // tokens connection index
      const connectionsStart = dataStart + 5;

      for (let j = 0; j < connectionCount * 2; j = j + 2) {
        cons.push(parseInt(tokens[connectionsStart + j], 10));
        conTypes.push(tokens[connectionsStart + j + 1]);
      }

      fullerData.push({
        Energy: energy,
        x: x,
        y: y,
        z: z,
        conectionCount: connectionCount,
        connections: cons,
        conTypes: conTypes,
      });
    }
    return fullerData;
  } catch (err) {
    console.error("Parsing error:", err.message);
    throw err;
  }
};

export default { prc: parseFullerenFromPath };
