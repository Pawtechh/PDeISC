import fs from 'fs';
import { onlyNumbersValidation } from '../utils/validations.js';
import { sortNumbers } from '../utils/sorter.js';
import { isFactorialNumber } from '../utils/factorial.js';
import { saveResultTXT } from '../utils/fileGenerator.js';

export const processTXT = (req, res) => {

    try {

        const filePath = req.file.path;

        const content = fs.readFileSync(filePath, 'utf-8');

        const lines = content
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line !== '');

        const validation = onlyNumbersValidation(lines);

        if (!validation.valid) {
            return res.json({
                success: false,
                message: 'Este TXT no cumple con la validación'
            });
        }

        const usefulNumbers = [];
        const uselessNumbers = [];
        const factorialNumbers = [];

        lines.forEach(number => {

            // Single-digit numbers (1-9) are never useful or factorial
            if (number.length === 1) {
                uselessNumbers.push(Number(number));
                return;
            }

            if (number[0] === number[number.length - 1]) {

                usefulNumbers.push(Number(number));

                if (isFactorialNumber(Number(number))) {
                    factorialNumbers.push(Number(number));
                }

            } else {
                uselessNumbers.push(Number(number));
            }
        });

        const sortedUseful = sortNumbers(usefulNumbers);

        const percentage = lines.length > 0
            ? ((usefulNumbers.length * 100) / lines.length).toFixed(2)
            : 0;

        const generatedFile = saveResultTXT(sortedUseful);

        res.json({
            success: true,
            usefulNumbers: sortedUseful,
            uselessNumbers,
            factorialNumbers,
            usefulCount: usefulNumbers.length,
            uselessCount: uselessNumbers.length,
            percentage,
            generatedFile
        });

    } catch (error) {

        res.json({
            success: false,
            message: 'Error procesando archivo'
        });
    }
};
