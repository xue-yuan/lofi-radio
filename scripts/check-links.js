import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIONS_PATH = path.resolve(__dirname, '../src/stations.json');

async function checkYoutubeLink(id) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error(`Error checking ${id}:`, error.message);
    return false;
  }
}

async function run() {
  console.log('🚀 Starting YouTube Health Check...');

  const data = JSON.parse(fs.readFileSync(STATIONS_PATH, 'utf-8'));
  let brokenCount = 0;
  let totalCount = 0;

  for (const category of data) {
    console.log(`\nChecking category: ${category.name}`);
    for (const channel of category.channels) {
      totalCount++;
      process.stdout.write(`  - Checking [${channel.id}] ${channel.title.substring(0, 30)}... `);

      const isValid = await checkYoutubeLink(channel.id);
      if (!isValid) {
        console.log('❌ BROKEN');
        channel.broken = true;
        brokenCount++;
      } else {
        console.log('✅ OK');
        if (channel.broken) delete channel.broken;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  const brokenLinks = data.flatMap(cat =>
    cat.channels
      .filter(ch => ch.broken)
      .map(ch => `- [${ch.title}](https://www.youtube.com/watch?v=${ch.id}) (ID: \`${ch.id}\`)`)
  );

  let report = '';
  if (brokenCount > 0) {
    console.log(`\nFound ${brokenCount} broken links. Updating JSON...`);
    fs.writeFileSync(STATIONS_PATH, JSON.stringify(data, null, 2));

    report = [
      'The automated health check has identified the following broken YouTube links:',
      '',
      ...brokenLinks,
      '',
      'These have been marked as `broken: true` in `src/stations.json` to exclude them from the player.'
    ].join('\n');
  } else {
    console.log('\n✨ All links are healthy!');
    report = '✨ All YouTube links are healthy! No action required.';
  }

  fs.writeFileSync(path.resolve(__dirname, '../reports/broken-links-report.md'), report);
  console.log('✅ Report generated in reports/broken-links-report.md');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
