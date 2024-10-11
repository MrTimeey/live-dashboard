import { appConfig } from "./appConfig.js";
import Imap from "imap-simple";
import * as cheerio from 'cheerio';
import Iconv from "iconv-lite";
import quotedPrintable from "quoted-printable";
import dayjs from "dayjs";

const config = {
    imap: {
        user: appConfig.mail.user,
        password: appConfig.mail.pass,
        host: appConfig.mail.host,
        port: appConfig.mail.port,
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
    }
};

async function connectToImap() {
    try {
        const connection = await Imap.connect(config);
        await connection.openBox('INBOX');
        return connection;
    } catch (error) {
        console.error('Fehler beim Herstellen der Verbindung zum IMAP-Server:', error);
        throw error;
    }
}

async function checkEmails() {
    let connection;
    try {
        connection = await connectToImap();

        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        for (const item of messages.reverse()) {
            const all = item.parts.find(part => part.which === 'TEXT');
            const header = item.parts.find(part => part.which.includes('HEADER'));

            if (header.body.from[0].includes('garmin.com')) {
                const emailDate = header.body.date[0];
                const emailTimestamp = dayjs(emailDate).format('DD.MM.YYYY HH:mm:ss');

                const decodedQuotedPrintable = quotedPrintable.decode(all.body);
                const decodedBody = Iconv.decode(Buffer.from(decodedQuotedPrintable), 'utf-8');

                const $ = cheerio.load(decodedBody);

                const links = $('a');
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    const url = $(link).attr('href');
                    if (url && url.toLowerCase().includes('livetrack') && url.toLowerCase().includes('session')) {
                        console.log('Date:', emailTimestamp)
                        console.log('Link:', url);
                        console.log('----')
                    }
                }
            }
        }

    } catch (error) {
        console.error('Fehler beim Prüfen der E-Mails:', error);
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

checkEmails()
