# English Word Trainer

PWA-тренажер английских слов с уроками, XP, streak и разделом **Чат для двоих**.

## Запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env` рядом с `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Запустите приложение:

```bash
npm run dev
```

Откройте адрес из терминала, обычно `http://127.0.0.1:5173`.

## Supabase

1. Создайте проект в [Supabase](https://supabase.com).
2. Откройте **Project Settings → API** и скопируйте:
   - Project URL в `VITE_SUPABASE_URL`
   - anon public key в `VITE_SUPABASE_ANON_KEY`
3. Откройте **Authentication → Providers → Email**.
4. Для простого входа двух пользователей можно временно отключить обязательное подтверждение email: **Confirm email = off**.
5. Создайте двух пользователей через интерфейс приложения или в Supabase Auth:
   - Муслим
   - Она

## Таблица messages

В Supabase откройте **SQL Editor** и выполните:

```sql
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (sender_name in ('Муслим', 'Она')),
  text text not null check (char_length(text) <= 4000),
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

alter table public.messages enable row level security;

create policy "authenticated users can read messages"
on public.messages
for select
to authenticated
using (true);

create policy "authenticated users can insert own messages"
on public.messages
for insert
to authenticated
with check (auth.uid() = sender_id);

create policy "authenticated users can mark incoming messages as read"
on public.messages
for update
to authenticated
using (auth.uid() <> sender_id)
with check (auth.uid() <> sender_id);
```

## Realtime

1. В Supabase откройте **Database → Replication**.
2. Включите Realtime для таблицы `messages`.
3. Убедитесь, что таблица находится в публикации `supabase_realtime`.

SQL-вариант:

```sql
alter publication supabase_realtime add table public.messages;
```

## Уведомления

Приложение просит разрешение на уведомления при первом входе и также показывает кнопку **Включить уведомления**.

- Если вкладка открыта, новое сообщение показывается как in-app toast.
- Если вкладка свернута или неактивна, приложение показывает системное browser notification через Service Worker.
- Полностью закрытое приложение не может получить событие Supabase Realtime: для настоящего push в закрытый браузер нужен Web Push отправитель, например Supabase Edge Function с VAPID-ключами. Service Worker уже содержит `push` listener, чтобы позже подключить такой сценарий.

Если уведомления запрещены, откройте настройки сайта в браузере и разрешите Notifications/Уведомления.

## Сборка

```bash
npm run build
```

Готовые файлы появятся в `dist`.
