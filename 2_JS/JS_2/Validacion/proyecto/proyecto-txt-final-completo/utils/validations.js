export const onlyNumbersValidation = (array) => {

    const regex = /^\d+$/;

    for (const item of array) {

        if (!regex.test(item)) {
            return {
                valid: false
            };
        }
    }

    return {
        valid: true
    };
};
