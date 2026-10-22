---
name: surf-rn-patterns
description: Patrones y convenciones para React Native + Expo + Redux Toolkit + React Navigation. Se activa al crear pantallas, navegación, estado o integración con API.
---

# Skill: React Native Patterns

## Stack
- Expo SDK 52+
- React Navigation 7 (Native Stack + Bottom Tabs + Drawer)
- Redux Toolkit + RTK Query
- React Hook Form + Zod
- NativeWind v4 (Tailwind para RN)
- Moti + Reanimated 3
- Tamagui (primitives)
- Expo Image, Expo Notifications, Expo SecureStore

## Estructura mobile
```text
mobile/
├── src/
│   ├── api/ (axios instance + endpoints RTK Query)
│   ├── store/ (slices: auth, ui, cart)
│   ├── navigation/ (Root, Auth, ConsumerTabs, OwnerTabs, AgencyTabs)
│   ├── screens/
│   │   ├── auth/
│   │   ├── public/
│   │   ├── consumer/
│   │   ├── owner/
│   │   └── agency/
│   ├── components/
│   │   ├── ui/ (primitives del design system)
│   │   ├── boards/
│   │   ├── rentals/
│   │   └── ...
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── theme/
│   └── types/
```

## Navegación por rol
```text
RootNavigator
├── AuthStack (si no logueado)
│   ├── Login
│   ├── Register
│   └── ForgotPassword
└── MainNavigator (si logueado)
    ├── si CONSUMER → ConsumerTabs
    │   ├── Catálogo
    │   ├── Mis Alquileres
    │   ├── Puntos
    │   └── Perfil
    ├── si OWNER → OwnerTabs
    │   ├── Mis Tablas
    │   ├── Revisiones (badge con count pendientes)
    │   ├── Reclamos
    │   └── Ganancias
    │   └── Perfil
    └── si AGENCIA → AgencyTabs
        ├── Dashboard
        ├── Entregas
        ├── Devoluciones
        ├── Solicitudes
        └── Liquidaciones
```

## RTK Query — patrón obligatorio
```ts
// src/api/boards.ts
export const boardsApi = createApi({
  reducerPath: 'boards',
  baseQuery: baseQueryWithAuth,   // incluye refresh automático
  tagTypes: ['Board', 'Rental', 'Claim'],
  endpoints: (builder) => ({
    getBoards: builder.query<Board[], Filters>({
      query: (filters) => ({ url: '/boards', params: filters }),
      providesTags: ['Board'],
    }),
    getBoard: builder.query<Board, string>({
      query: (id) => `/boards/${id}`,
      providesTags: (_, __, id) => [{ type: 'Board', id }],
    }),
    createBoard: builder.mutation<Board, Partial<Board>>({
      query: (body) => ({ url: '/boards', method: 'POST', body }),
      invalidatesTags: ['Board'],
    }),
  }),
})
```

## Refresh token automático
```ts
// baseQueryWithAuth.ts
const baseQuery = fetchBaseQuery({ baseUrl: '/api' })
export const baseQueryWithAuth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions)
    if (refreshResult.data) {
      // guardar nuevos tokens
      result = await baseQuery(args, api, extraOptions)
    } else {
      api.dispatch(logout())
    }
  }
  return result
}
```

## Formularios — patrón obligatorio
```tsx
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginScreen() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const [login, { isLoading, error }] = useLoginMutation()
  
  const onSubmit = handleSubmit(async (data) => {
    try { await login(data).unwrap() }
    catch (e) { /* mostrar error */ }
  })
  
  return (/* UI con <Controller /> para cada field */)
}
```

## Persistencia sesión
```ts
// tokens en SecureStore (nunca AsyncStorage para tokens)
import * as SecureStore from 'expo-secure-store'

export const tokenStorage = {
  save: async (tokens) => {
    await SecureStore.setItemAsync('access', tokens.access)
    await SecureStore.setItemAsync('refresh', tokens.refresh)
  },
  get: async () => ({
    access: await SecureStore.getItemAsync('access'),
    refresh: await SecureStore.getItemAsync('refresh'),
  }),
  clear: async () => {
    await SecureStore.deleteItemAsync('access')
    await SecureStore.deleteItemAsync('refresh')
  },
}
```

## Reglas duras
- NUNCA fetch directo. Siempre RTK Query.
- NUNCA AsyncStorage para tokens. Siempre SecureStore.
- NUNCA lógica de negocio en componentes. Va en hooks o utils.
- TODO string de UI en español.
- TODO formulario con Zod + React Hook Form.
- Toda lista >20 items con FlashList.
- Toda imagen con Expo Image + blurhash.
- Toda animación con Moti/Reanimated.
- Todo error mostrado al user, nunca silencioso.
- Loading con skeleton, no spinner.
