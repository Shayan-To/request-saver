import express from "express";
import _fs, { WriteStream } from "fs";
import _fsp from "fs/promises";
import { pipeline } from "stream/promises";

const fs = { ..._fs, ..._fsp };

const app = express();

app.all(/^\/[^/]+$/, async (req, res) => {
    let file: WriteStream | undefined;
    try {
        const id = req.url.replace(/^\//, "");
        const method = req.method.toLowerCase();
        const dir = `${id}-${method}`;

        if (dir === "favicon.ico-get") {
            res.status(404).send("No favicon.");
            return;
        }

        await fs.mkdir(`./data/${dir}`, { recursive: true });
        file = fs.createWriteStream(
            `./data/${dir}/${new Date()
                .toISOString()
                .replace("Z", "")
                .replace(/[T\.]/g, "_")
                .replace(/[:]/g, "-")}`
        );
        await pipeline(req, file);
        file.destroy();

        res.send("Done.");
    } catch (ex) {
        res.status(500).send(
            typeof ex !== "object" || ex === null
                ? `${ex}`
                : Object.entries(ex)
                      .map(([k, v]) => {
                          try {
                              return `<strong>${k}:</strong> <small>${JSON.stringify(v)}</small>`;
                          } catch {
                              return `<strong>${k}:</strong> <small>---</small>`;
                          }
                      })
                      .join("<br><br>")
        );
    } finally {
        file?.destroy();
    }
});

app.listen(5534, "::", () => console.log("http://localhost:5534/"));
