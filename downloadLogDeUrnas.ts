// #!/usr/bin/env deno run --allow-net --allow-write

import * as path from "https://deno.land/std@0.159.0/path/mod.ts";

import TseClient from "./tse/client.ts";

const downloadDir = './downloads';

for (const estado of TseClient.estados) {
    const targetDir = path.join(downloadDir, estado.toLowerCase());
    await Deno.mkdir(targetDir, { recursive: true });
}

const c = new TseClient;

for await (const arquivo of c.arquivosUrnas('ele2022', '406')) {
    if (!arquivo.url.endsWith('.logjez')) continue;

    const estado = arquivo.urna.secao.zona.municipio.estado;
    const targetPath = path.join(downloadDir, estado.cd.toLowerCase(), arquivo.nmarq);
    console.log(targetPath);
    await download(arquivo.url, targetPath);
}

async function download(url: string, targetPath: string) {
    const res = await fetch(url);
    const data = await res.arrayBuffer();
    return await Deno.writeFile(targetPath, new Uint8Array(data));
}