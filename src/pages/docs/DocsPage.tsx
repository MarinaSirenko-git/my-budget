export default function DocsPage() {
  return (
    <div className="flex flex-col p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-4">Как это работает и почему помогает</h1>
        <p className="text-mainTextColor dark:text-mainTextColor">Метод «<strong>внеси доходы → задай цели → категоризируй траты → используй конверты</strong>» превращает деньги из абстракции в понятный план: вы видите, сколько приходит, на что уходит, какие цели важнее и какие лимиты у каждой категории. Это снижает тревожность, убирает «утечки» и даёт ощущение контроля.</p>
      </header>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">1) Внести доходы → понять реальную базу</h2>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Зачем:</strong> без честного учёта доходов любые планы «в воздухе».</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Что даёт:</strong> фиксированная рамка (месячная/годовая), от которой считаются лимиты и сроки целей.</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Результат:</strong> исчезают иллюзии «кажется, хватит», появляются реальные цифры.</p>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">В приложении:</h3>
          <ul className="list-disc list-inside space-y-2 text-mainTextColor dark:text-mainTextColor">
            <li>Внесите все источники (зарплата, фриланс, кэшбэк, проценты, аренда и т. п.).</li>
            <li>Отметьте регулярность (месяц/квартал/год), чтобы расчёты были корректными.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">2) Внести цели → дать деньгам направление</h2>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Зачем:</strong> деньги без цели «растворяются».</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Что даёт:</strong> приоритеты (подушка, отпуск, первый взнос), сроки и нужная сумма.</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Результат:</strong> появляется мотивация и критерий успеха («идём по плану / отстаём»).</p>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">В приложении:</h3>
          <ul className="list-disc list-inside space-y-2 text-mainTextColor dark:text-mainTextColor">
            <li>Добавьте цель (сумма + дедлайн + приоритет).</li>
            <li>Система сравнит цели с остатком после расходов и подскажет, что реально.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">3) Категоризировать траты → найти «чёрные дыры»</h2>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Зачем:</strong> «траты вообще» не режутся; режутся конкретные категории.</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Что даёт:</strong> видимость «куда утекает», быстрые победы в нескольких категориях.</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Результат:</strong> находите 2–3 зоны для оптимизации без чувства лишений.</p>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">В приложении:</h3>
          <ul className="list-disc list-inside space-y-2 text-mainTextColor dark:text-mainTextColor">
            <li>Используйте готовые категории (еда, транспорт, жильё, связь и т. д.) или добавьте свои.</li>
            <li>Включайте автозачёт износа/налогов для доходов типа аренды — расходы пересчитаются автоматически.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">4) Метод конвертов → превратить план в поведение</h2>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Зачем:</strong> «конверт» (лимит на категорию) превращает намерение в действие.</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Как работает:</strong> каждой категории назначается жёсткий лимит; тратить сверх нельзя, можно перераспределять между конвертами осознанно.</p>
        <p className="text-mainTextColor dark:text-mainTextColor"><strong>Результат:</strong> бюджет становится самоограничивающей системой — не нужно всё время «считать в голове».</p>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-mainTextColor dark:text-mainTextColor mb-2">В приложении:</h3>
          <ul className="list-disc list-inside space-y-2 text-mainTextColor dark:text-mainTextColor">
            <li>Задайте лимиты по категориям (конверты).</li>
            <li>Следите за остатком по конверту и общим остатком месяца.</li>
            <li>Если не укладываетесь — пересмотрите лимит или приоритеты целей (план становится реалистичнее).</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">Почему это действительно помогает</h2>
        <ul className="list-disc list-inside space-y-2 text-mainTextColor dark:text-mainTextColor">
          <li><strong>От абстракций к структуре:</strong> доходы → цели → категории → лимиты. Мозг любит понятные шаги.</li>
          <li><strong>Приоритеты видны:</strong> деньги «работают» на цели, а не «исчезают» случайно.</li>
          <li><strong>Меньше стресса:</strong> решения принимаются в момент планирования, а не на кассе.</li>
          <li><strong>Гибкость без самообмана:</strong> лимиты можно менять, но осознанно — виден trade-off.</li>
          <li><strong>Обратная связь:</strong> прогресс и отставание видны сразу; приложение подсказывает корректировки.</li>
        </ul>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">Что делает приложение за вас</h2>
        <ul className="list-disc list-inside space-y-2 text-mainTextColor dark:text-mainTextColor">
          <li><strong>Конвертирует валюты</strong> и даёт единую картину.</li>
          <li><strong>Автоматически разносит</strong> часть доходов в расходы (налоги, износ при аренде).</li>
          <li><strong>Визуализирует</strong> доходы/расходы/цели (диаграммы, прогресс по целям).</li>
          <li><strong>Предупреждает</strong> о перерасходе и предлагает варианты (сдвинуть лимит, снизить трату, перенести цель).</li>
          <li><strong>Сохраняет сценарии</strong> (например, другой город/пригород) и позволяет сравнивать их бок о бок.</li>
        </ul>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">Как пользоваться, чтобы сработало</h2>
        <ol className="list-decimal list-inside space-y-2 text-mainTextColor dark:text-mainTextColor">
          <li><strong>Запишите все доходы</strong> (месяц + годовые, премии, сезонные).</li>
          <li><strong>Добавьте 2–3 главные цели</strong> с суммой и сроком.</li>
          <li><strong>Разбейте траты по категориям</strong> и задайте <strong>лимиты-конверты</strong>.</li>
          <li><strong>Живите внутри лимитов</strong>: если не хватает — меняйте лимит или цель, а не игнорируйте план.</li>
          <li><strong>Пересматривайте раз в месяц</strong>: план работает, когда он живой.</li>
        </ol>
      </section>

      <section className="space-y-2 mb-8">
        <h2 className="text-lg font-semibold text-mainTextColor dark:text-mainTextColor">Частые вопросы</h2>
        <div className="space-y-3">
          <details className="text-mainTextColor dark:text-mainTextColor">
            <summary className="cursor-pointer font-medium">Что если доход нестабилен?</summary>
            <p className="mt-2 ml-4">Заложите «базовый» сценарий (минимальный доход) и «оптимистичный». Приложение покажет, как учесть оба.</p>
          </details>
          <details className="text-mainTextColor dark:text-mainTextColor">
            <summary className="cursor-pointer font-medium">Что если цель «не тянет»?</summary>
            <p className="mt-2 ml-4">Пересчитайте срок или уменьшите сумму. Лучше реалистичный план, чем идеальный на бумаге.</p>
          </details>
          <details className="text-mainTextColor dark:text-mainTextColor">
            <summary className="cursor-pointer font-medium">Можно ли тратить сверх конверта?</summary>
            <p className="mt-2 ml-4">Да, но только через явное перераспределение из другого конверта — так виден компромисс, и импульсивные траты уменьшаются.</p>
          </details>
        </div>
      </section>
    </div>
  );
}

