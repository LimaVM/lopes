const express = require('express');
const os = require('os');
const { exec } = require('child_process');

const router = express.Router();

function getGPUInfo() {
    return new Promise(resolve => {
        exec('lspci | grep -i "vga\|3d\|2d"', (err, stdout) => {
            if (err || !stdout) {
                return resolve('Nenhuma GPU detectada');
            }
            const line = stdout.split('\n')[0].trim();
            resolve(line || 'Nenhuma GPU detectada');
        });
    });
}

router.get('/', async (req, res) => {
    const cpus = os.cpus();
    const cpuModel = cpus && cpus[0] ? cpus[0].model.trim() : 'Desconhecido';
    const totalMemGB = Math.round(os.totalmem() / (1024 ** 3)) + ' GB';
    const gpuInfo = await getGPUInfo();

    res.json({
        cpu: cpuModel,
        ram: totalMemGB,
        gpu: gpuInfo
    });
});

module.exports = router;
