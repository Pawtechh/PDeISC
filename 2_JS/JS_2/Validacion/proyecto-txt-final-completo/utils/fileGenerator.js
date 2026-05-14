import fs from 'fs';

export const saveResultTXT = (numbers) => {

    const fileName = `resultado-${Date.now()}.txt`;

    const content = numbers.join('\n');

    fs.writeFileSync(`uploads/${fileName}`, content);

    return fileName;
};
