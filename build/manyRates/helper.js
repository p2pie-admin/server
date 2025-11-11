"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pmPointerToPm = exports.getPmsFromPmGroup = void 0;
const getOptionCode = (option, prefix) => {
    return ((option?.code && option?.code.toUpperCase()) || // USDTERC
        (prefix &&
            prefix.toUpperCase() !== option?.currency?.code.toUpperCase() &&
            prefix.toUpperCase() + option?.currency?.code.toUpperCase()) || // SBERRUB
        option?.currency?.code.toUpperCase()); // BTC
};
const getPmsFromPmGroup = (pm_group, popular_as) => {
    return pm_group.options.map((option) => {
        const code = getOptionCode(option, pm_group?.prefix);
        const subgroup_name = option.name && option.name.toUpperCase();
        const en_name = pm_group.en_name + " " + option?.currency?.code;
        const ru_name = pm_group.ru_name
            ? pm_group.ru_name + " " + option?.currency?.code
            : "";
        return {
            code, // USDTERC20
            en_name, // Tether ERC-20
            ru_name,
            subgroup_name, // ERC-20
            currency: option?.currency, // USDT
            icon: pm_group.icon,
            color: pm_group.color,
            popular_as,
        };
    });
};
exports.getPmsFromPmGroup = getPmsFromPmGroup;
const pmPointerToPm = (pointer) => {
    // from frontend
    const { code, pm_group, popular_as } = pointer;
    if (!pm_group?.options)
        return;
    const pms = (0, exports.getPmsFromPmGroup)(pm_group, popular_as);
    if (!code || !pms)
        return pms[0];
    return pms.find((pm) => pm.code.toLowerCase() == code.toLowerCase());
};
exports.pmPointerToPm = pmPointerToPm;
//
