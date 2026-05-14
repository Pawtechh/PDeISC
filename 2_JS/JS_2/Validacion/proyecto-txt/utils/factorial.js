export const isFactorialNumber = (number) => {

    let factorial = 1;
    let i = 1;

    while (factorial < number) {
        i++;
        factorial *= i;
    }

    return factorial === number;
};