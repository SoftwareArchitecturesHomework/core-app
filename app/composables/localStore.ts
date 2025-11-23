function createLocaleStore() {
    const locale = useVLocale();
    const stored = useCookie<string | null>(
        'locale',
        {
            default: () => null,
            httpOnly: false,
            readonly: false,
        },
    );

    if (stored.value) {
        locale.current.value = stored.value;
    }

    return {
        t: locale.t,
        current:
            locale.current as ComputedRef<string>,
        set(newLocale: string) {
            locale.current.value = stored.value =
                newLocale;
        },
    };
}

let localeStore: ReturnType<
    typeof createLocaleStore
>;
export function useLocaleStore() {
    localeStore ??= createLocaleStore();
    return localeStore;
}