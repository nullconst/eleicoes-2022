export default class Client {
    static readonly estados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "ZZ", "GO", "MA", "MT", "MS", "MG", "PR", "PB", "PA", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SE", "SP", "TO"];

    async *secoes(ele_c: string, pleito: string, estados: string | string[] = Client.estados) {
        if (typeof estados == 'string') {
            estados = [estados];
        }

        for (const estado of estados) {
            const arquivoUrnaConfigCs = await this.fetchArquivoUrnaConfigCs(ele_c, pleito, estado);
            for (const estado of arquivoUrnaConfigCs.abr) {
                for (const municipio of estado.mu) {
                    for (const zona of municipio.zon) {
                        for (const secao of zona.sec) {
                            yield {
                                ...secao, zona: {
                                    ...zona, municipio: {
                                        ...municipio, estado
                                    }
                                }
                            };
                        }
                    }
                }
            }
        }
    }

    async *urnas(ele_c: string, pleito: string, estados: string | string[] = Client.estados) {
        for await (const secao of this.secoes(ele_c, pleito, estados)) {
            const { zona: { cd: zona, municipio: { cd: municipio, estado: { cd: estado } } } } = secao;
            const urna = await this.fetchArquivoUrnaDadosAux(ele_c, pleito, estado, municipio, zona, secao.ns);
            yield { ...urna, secao };
        }
    }

    async *arquivosUrnas(ele_c: string, pleito: string, estados: string | string[] = Client.estados) {
        for await (const urna of this.urnas(ele_c, pleito, estados)) {
            const {
                secao: { ns: secao,
                    zona: { cd: zona,
                        municipio: { cd: municipio,
                            estado: { cd: estado }
                        }
                    }
                }
            } = urna;

            for (const pack of urna.hashes) {
                for (const nmarq of pack.nmarq) {
                    const url = `https://resultados.tse.jus.br/oficial/${ele_c}/arquivo-urna/${pleito}/dados/${estado.toLowerCase()}/${municipio}/${zona}/${secao}/${pack.hash}/${nmarq}`;
                    yield { url, nmarq, pack, urna };
                }
            }
        }
    }

    async fetchArquivoUrnaConfigCs(c: string, pl: string, cm: string) {
        const url = `https://resultados.tse.jus.br/oficial/${c}/arquivo-urna/${pl}/config/${cm.toLowerCase()}/${cm.toLowerCase()}-p${pl.padStart(6, '0')}-cs.json`;
        const res = await fetch(url);
        return await res.json();
    }

    async fetchArquivoUrnaDadosAux(c: string, pl: string, cm: string, m: string, z: string, s: string) {
        const url = `https://resultados.tse.jus.br/oficial/${c}/arquivo-urna/${pl}/dados/${cm.toLowerCase()}/${m}/${z}/${s}/p${pl.padStart(6, '0')}-${cm.toLowerCase()}-m${m}-z${z}-s${s}-aux.json`;
        const res = await fetch(url);
        return await res.json();
    }
}