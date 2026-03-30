interface PageProps {
  params: {departmentSlug: string; actionSlug: string}
}

export default function ActionPage({params}: PageProps) {
  const {departmentSlug, actionSlug} = params

  return (
    <div>
      <h1>
        {departmentSlug} / {actionSlug}
      </h1>
      {/* dynamically render the action */}
    </div>
  )
}
